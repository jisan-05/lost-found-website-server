require('dotenv').config()
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
app.use(cors())
app.use(express.json())



  

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pmlso.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const lostFoundItems = client.db('LostFound').collection('ItemsCollection')
    const RecoveredItems = client.db('LostFound').collection('RecoveredCollection')

    app.post('/items', async(req,res) => {
      const item = req.body;
      const result = await lostFoundItems.insertOne(item)
      res.send(result)
    })

    // Post Recovered Items 
    app.post("/recoveredItems", async(req,res) => {
      const item = req.body;
      // console.log(item)
      const result = await RecoveredItems.insertOne(item)
      res.send(result) 
    })

    // Get Specific Items
    app.get('/items/id/:id', async(req,res)=>{
      const id = req.params.id;
      console.log(id)
      const query = {_id: new ObjectId(id)}
      const result = await lostFoundItems.findOne(query)
      res.send(result)
    })


    // Get All Items 
    app.get('/items',async(req,res)=>{
      const query = lostFoundItems.find()
      const result = await query.toArray()
      res.send(result)
    })
    // Get specific user Data items
    app.get('/items/user/:email',async(req,res)=>{
      const email = req.params.email;
      const filter = {contactInfo: email}
      const result = await lostFoundItems.find(filter).toArray()
      // const query = lostFoundItems.find()
      // const result = await query.toArray()
      res.send(result)
    })
    // get recovered Item with filter specific email 
    app.get('/allRecovered/:email',async(req,res)=>{
      const email = req.params.email;
      const filter = {
        ItemCreator: email,
      }
      const result = await RecoveredItems.find(filter).toArray()
      res.send(result)
    })

    // Update 1 item
    app.patch('/items/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id:new ObjectId(id)};
      const options = { upsert: true };
      const {status} = req.body;
      const updateDoc = {
        $set:{
          status:status
        }
      }

      const result = await lostFoundItems.updateOne(filter,updateDoc,options)
      res.send(result)
      console.log(id,status)
    })

    // Update 1 item
    app.patch('/update/:id', async(req,res)=>{
      const id = req.params.id;
      const UpdateItem = req.body;
      const filter = {_id:new ObjectId(id)};
      const options = { upsert: true };
      const updateDoc = {
        $set:{
          postType:UpdateItem.postType,
          Thumbnail:UpdateItem.Thumbnail,
          Title:UpdateItem.Title,
          Description:UpdateItem.Description,
          Category:UpdateItem.Category,
          Location:UpdateItem.Location,
          Date:UpdateItem.Date,
        }
      }

      const result = await lostFoundItems.updateOne(filter,updateDoc,options)
      res.send(result)
      console.log(id.status)
    })



    // delete specific item
    app.delete('/items/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = lostFoundItems.deleteOne(query)
      res.send(result)
    })

    

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req,res) => {
  res.send("Lost Found Server is Running")
})

app.listen(port,()=> {
  console.log("Lost and Found running on port :",port)
})