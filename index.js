const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
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

    const bannerCollection = client.db('languageSchoolDB').collection('bannerImg')
    const instructorCollection = client.db('languageSchoolDB').collection('instructors')
    const classCollection = client.db('languageSchoolDB').collection('classes')
    const enrollCollection = client.db('languageSchoolDB').collection('enrollCourse')


    // jwt token generate 
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
      res.send({ token })
})
    app.get('/banners', async (req, res) => {
      const result = await bannerCollection.find().toArray()
      res.send(result)
    })
    // instructors api 
    app.get('/instructors', async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result)

    })

    //classes api
    app.get('/classes', async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result)
    })


    //added course to server
    app.post('/enrollCourse',async(req,res)=>{
      const item= req.body;
      const result=await enrollCollection.insertOne(item);
      res.json(result)
    })

    app.get('/enrollCourse',async(req,res)=>{
      const result = await enrollCollection.find().toArray();
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