require('dotenv').config()
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req,res) => {
  res.send("Lost Found Server is Running")
})

app.listen(port,()=> {
  console.log("Lost and Found running on port :",port)
})