const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000

// midleware languageClub  GNJCUO0PZ158bfcD
app.use(cors());
app.use(express.json())

// verifyJwt 
const verifyJWT = (req, res, next) => {

  const authorization = req.headers.authorization;
  // console.log(req.headers);

  if (!authorization) {
    return res.status(401).send({ message: 'Unauthorized Access' })
  }
  const token = authorization.split(' ')[1];
  // console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'Unauthorized access' })
    }
    req.decoded = decoded;
    next()
  })


}


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
    const selectCourseCollection = client.db('languageSchoolDB').collection('selectedCourseCourse')
    const userCollection = client.db('languageSchoolDB').collection('users')
    const enrollCourseCollection = client.db('languageSchoolDB').collection('enrollCourses')
    const paymentCourseCollection = client.db('languageSchoolDB').collection('payments')


    // jwt token generate 
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
      res.send({ token })
    })

    // admin verify 
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'Forbidden access' })
      }
      next()

    }


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
    app.post('/selectCourse', verifyJWT, async (req, res) => {
      const item = req.body;
      const result = await selectCourseCollection.insertOne(item);
      res.json(result)
    })

    app.get('/selectCourse', verifyJWT, async (req, res) => {
      const { email } = req.query;


      if (!email) {
        return res.send([])
      }
      const decodedEmail = req.decoded.email;
      // const decodedEmail= req.decoded.email;
      if (decodedEmail !== email) {
        return res.status(403).send({ error: true, message: 'Forbidden Access' })
      }

      const query = { email: email };
      const result = await selectCourseCollection.find(query).toArray();
      const sortedResult = result.sort((a, b) => new Date(b.date) - new Date(a.date))
      res.send(sortedResult)
    })

    app.delete('/selectedCourse/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await selectCourseCollection.deleteOne(query);
      res.send(result)
    })




    //users api's
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const savedUser = await userCollection.findOne(query);
      if (savedUser) {
        return res.send({ message: 'User Already added' })
      }
      const result = await userCollection.insertOne(user);
      res.send(result)
    })

    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    })

    app.patch('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: `admin`
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      // console.log(result);
      res.send(result)
    })

    app.patch('/users/instructor/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateRole = {
        $set: {
          role: 'instructor'
        },
      };
      const result = await userCollection.updateOne(filter, updateRole);
      res.send(result)
    })

    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      if (req.decoded.email !== email) {
        return res.send({ admin: false })
      }
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === 'admin' };
      // console.log(result);
      // console.log(result);
      res.send(result)
    })

    app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result)
    })


    // payment's api 
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const { price } = req.body;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price * 100,
        currency: "usd",
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post('/payments', verifyJWT, async (req, res) => {
      const payment = req.body;
      const insertResult = await paymentCourseCollection.insertOne(payment);

      const query = { _id: { $in: payment.courseItems.map(id => new ObjectId(id)) } }
      const deleteResult = await selectCourseCollection.deleteMany(query);
      console.log(insertResult);
      res.send({ insertResult, deleteResult })

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