require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
app.use(cookieParser())
app.use(cors({
    origin:['http://localhost:5173'],
    credentials:true
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pmlso.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        const lostFoundItems = client
            .db("LostFound")
            .collection("ItemsCollection");
        const RecoveredItems = client
            .db("LostFound")
            .collection("RecoveredCollection");

        // Verify Jwt  -- middleware
        const verifyJwt = (req,res,next) =>{
            const token = req.cookies.token
            if(!token){
                return res.status(401).send({message: "Unauthorized Access"})
            }
            jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
                if(err){
                    return res.status(401).send({message:"Unauthorized Access"})
                }
                req.user = decoded;
                next()
            })
        }


        // Auth Related Apis
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });
            res
            .cookie('token',token,{
              httpOnly:true,
              secure:false
            })
            .send({success:true});
        });
        // logout
        app.post('/logout',(req,res)=>{
            res.clearCookie('token',{
                httpOnly:true,
                secure:false
            })
            .send({success: true})
        })

        app.post("/items",verifyJwt, async (req, res) => {
            const item = req.body;
            if(req.user.emil !== req.params.email){
                return res.status(403).send({message: 'forbidden access'})
            }
            const result = await lostFoundItems.insertOne(item);
            res.send(result);
        });

        // Post Recovered Items
        app.post("/recoveredItems", async (req, res) => {
            const item = req.body;
            // console.log(item)
            const result = await RecoveredItems.insertOne(item);
            res.send(result);
        });

        // Get Specific Items
        app.get("/items/id/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await lostFoundItems.findOne(query);
            res.send(result);
        });

        // Get All Items
        app.get("/items", async (req, res) => {
            
            const query = lostFoundItems.find();
            const result = await query.toArray();
            res.send(result);
        });

        // get all items
        app.get('/all-items',async(req,res)=>{
            const filter = req.query.filter;
            const search = req.query.search;
            // console.log(search)
            let query = {Title:{
                $regex:search, $options:'i'
            }}
            if(filter)query.Category = filter;
            const result = await lostFoundItems.find(query).toArray()
            res.send(result)
        })

        // Get specific user Data items -- jwt done 
        app.get("/items/user/:email",verifyJwt, async (req, res) => {
            const email = req?.params?.email;
            const filter = { contactInfo: email };

            if(req.user.email !== req.params.email){
                return res.status(403).send({message: "forbidden access"})
            }

            const result = await lostFoundItems.find(filter).toArray();

            console.log("Cookie Paisi", req.cookies)

            // const query = lostFoundItems.find()
            // const result = await query.toArray()
            res.send(result);
        });
        // get recovered Item with filter specific email
        app.get("/allRecovered/:email",verifyJwt, async (req, res) => {
            const email = req.params.email;

            if(req.user.email !== req.params.email){
                return res.status(403).send({message: "forbidden access"})
            }

            const filter = {
                ItemCreator: email,
            };
            const result = await RecoveredItems.find(filter).toArray();
            res.send(result);
        });

        // Update 1 item
        app.patch("/items/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const { status } = req.body;
            const updateDoc = {
                $set: {
                    status: status,
                },
            };

            const result = await lostFoundItems.updateOne(
                filter,
                updateDoc,
                options
            );
            res.send(result);
            console.log(id, status);
        });

        // Update 1 item
        app.patch("/update/:id",verifyJwt, async (req, res) => {
            const id = req.params.id;
            if(req.user.email !== req.query.email){
                return res.status(403).send({message: "forbidden access"})
            }
            const UpdateItem = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    postType: UpdateItem.postType,
                    Thumbnail: UpdateItem.Thumbnail,
                    Title: UpdateItem.Title,
                    Description: UpdateItem.Description,
                    Category: UpdateItem.Category,
                    Location: UpdateItem.Location,
                    Date: UpdateItem.Date,
                },
            };

            const result = await lostFoundItems.updateOne(
                filter,
                updateDoc,
                options
            );
            res.send(result);
            console.log(id.status);
        });

        // delete specific item
        app.delete("/items/:id",verifyJwt, async (req, res) => {
            const id = req.params.id;
            if(req.user.email !== req.query.email){
                return res.status(403).send({message: 'forbidden access'})
            }
            const query = { _id: new ObjectId(id) };
            const result = lostFoundItems.deleteOne(query);
            res.send(result);
        });

        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Lost Found Server is Running");
});

app.listen(port, () => {
    console.log("Lost and Found running on port :", port);
});
