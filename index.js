const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000

// midleware languageClub  GNJCUO0PZ158bfcD
// const corsOptions = {
//   origin: '*',
//   credentials: true,
//   optionSuccessStatus: 200,
// }

app.use(cors());
app.use(express.json())
// app.use(express.static(path.join(__dirname, 'build')));
// app.use(express.static(path.join(__dirname, 'public')));

// verifyJwt 
const verifyJWT = async (req, res, next) => {

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
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '5h' })
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
    // instructor verify 
    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== 'instructor') {
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

      const result = await userCollection.find({ role: 'instructor' }).toArray();
      // console.log(result);
      res.send(result)

    })

    app.get('/instructor/courses', async (req, res) => {
      const { email } = req.query;
      // const query = {email:email};
      const result = await classCollection.find({ email: email }).toArray();

      res.send(result)
    })

    //classes api
    app.get('/classes', async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result)
    })


    //instructors added classes api's
    app.post('/addClass', verifyJWT, verifyInstructor, async (req, res) => {
      const newClass = req.body;
      const result = await classCollection.insertOne(newClass);

      res.send(result)
    })

    app.get('/instructorClasses', verifyJWT, verifyInstructor, async (req, res) => {
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
      const result = await classCollection.find(query).toArray();
      const sortedResult = result.sort((a, b) => new Date(b.date) - new Date(a.date))
      res.send(sortedResult);
    })


    app.get('/findClass/:id', verifyJWT, verifyInstructor, async (req, res) => {
      const { email } = req.query;


      if (!email) {
        return res.send([])
      }
      const decodedEmail = req.decoded.email;
      // const decodedEmail= req.decoded.email;
      if (decodedEmail !== email) {
        return res.status(403).send({ error: true, message: 'Forbidden Access' })
      }
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await classCollection.findOne(query)
      res.send(result)
    })

    app.patch('/instructor/class/update/:id', verifyJWT, verifyInstructor, async (req, res) => {
      const { email } = req.query;


      if (!email) {
        return res.send([])
      }
      const decodedEmail = req.decoded.email;
      // const decodedEmail= req.decoded.email;
      if (decodedEmail !== email) {
        return res.status(403).send({ error: true, message: 'Forbidden Access' })
      }
      const data = req.body;

      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: data
      }

      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    //added course to server
    app.post('/selectCourse', verifyJWT, async (req, res) => {
      const item = req.body;
      const result = await selectCourseCollection.insertOne(item);
      res.send(result)
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

    //enrollment courses api's
    app.post('/enrollCourse', verifyJWT, async (req, res) => {
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
      const paidCourse = await paymentCourseCollection.find(query).toArray()
      const allCourse = await classCollection.find().toArray()
      const AlreadySubmitted = await enrollCourseCollection.find().to

      const enrollCourses = paidCourse.flatMap(enroll => {
        const itemId = enroll.courseItemsId;
        return itemId.map(id => {
          const found = allCourse.find(course => course._id == id);
          return found
        })
      })

      const filterCourse = enrollCourses.map(course => {
        const saved = AlreadySubmitted.find(cd => cd._id == course._id);
        if (saved) {

        } else {
          return course
        }
      })

      // const deletePayment= 
      const insertEnroll = await enrollCourseCollection.insertMany(filterCourse);
      console.log(insertEnroll);

      res.send(insertEnroll)
    })


    app.get('/enrolls', verifyJWT, async (req, res) => {
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
      const result = await enrollCourseCollection.find(query).toArray();
      const sortedResult = result.sort((a, b) => new Date(b.date) - new Date(a.date))

      res.send(sortedResult)
    })

    // app.delete('/enrollCourses/:id', verifyJWT, async (req, res) => {
    //   const id=req.params.id;
    //   const query = {_id:new ObjectId(id)};
    //   const result = await enrollCourseCollection.deleteOne(query);
    //   res.send(result)
    // })




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

    app.get('/oneUsers', verifyJWT, async (req, res) => {
      const { email } = req.query;
      const query = { email: email }
      const result = await userCollection.findOne(query);
      // console.log(result);
      res.send(result);
    })

    app.patch('/updateInstructorInfo/:id', async (req, res) => {
      const user = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: user
      }

      const result = await userCollection.updateOne(filter, updateDoc);
      console.log(result);
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

    app.patch('/courseUpdate/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'Active'
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);

      res.send(result)
    })

    app.patch('/courseDeny/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'Denied'
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);

      res.send(result)
    })

    app.patch('/admin/sendFeedback/:id', async (req, res) => {
      const feedback = req.body.feedback;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          feedback: feedback
        }
      }

      const result = await classCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    app.delete('/admin/deleteCourse/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classCollection.deleteOne(query);
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

    //instrutor


    app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      if (req.decoded.email !== email) {
        return res.send({ instructor: false })
      }
      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
      // console.log(result);
      res.send(result)
    })




    app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result)
    })

    app.get('/paymentshistory', verifyJWT, async (req, res) => {
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
      const result = await paymentCourseCollection.find(query).toArray();
      const sortedResult = result.sort((a, b) => new Date(b.date) - new Date(a.date))

      res.send(sortedResult)
    })

    app.delete('/paymentHistoryDelete/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await paymentCourseCollection.deleteOne(query);
      res.send(result)
    })


    // payment's api 
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const { price } = req.body;
      const tk = parseFloat(price)

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: tk * 100,
        currency: "usd",
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post('/payments', verifyJWT, async (req, res) => {
      const payment = req.body;
      // const {email}= req.query;
      // const item = req.body;
      // const w = item.courseItemsId;
      const insertResult = await paymentCourseCollection.insertOne(payment);

      const query = { _id: new ObjectId(payment.selectItem) }
      const deleteResult = await selectCourseCollection.deleteOne(query);
      res.send(insertResult);

    })

    app.post('/paidCourses', verifyJWT, async (req, res) => {
      const course = req.body;
      const result = await enrollCourseCollection.insertOne(course);
      res.send(result)
    })

    app.patch('/reduceSeats/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        
        $inc: { available_seats: -1,enroll_student:1 },
        

      }

      const result = await classCollection.updateOne(filter, updateDoc)
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