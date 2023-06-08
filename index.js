const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 3000

// midleware languageClub  GNJCUO0PZ158bfcD
app.use(cors());
app.use(express.json())


// mongodb 



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nfkbd0s.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const bannerCollection= client.db('languageSchoolDB').collection('bannerImg')

    app.get('/banners',async(req,res)=>{
      const result= await bannerCollection.find().toArray()
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// mongodb 

app.get('/', (req, res) => {
  res.send('LANGUAGE LEARNING SCHOOL SERVER IS RUNNING...!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})