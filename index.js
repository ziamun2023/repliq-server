const express=require('express')
const cors=require ('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const jwt= require('jsonwebtoken')
const bcrypt = require('bcrypt');
const app=express()
const port =process.env.PORT || 5000
const saltRounds = 10

//middleware
app.use(cors())
app.use(express.json())

console.log(process.env.DB_PASS)


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0xqymst.mongodb.net/?retryWrites=true&w=majority`;

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
    const db=client.db("test");
    const userCollectionUser=db.collection('easyshop-User')
    const allproducts=db.collection('productsShop')
    const booking=db.collection('addtocart')


    // app.post('/users', async (req, res) => {
    //   const name= req.body.name
    //   const email = req.body.email;
    //   const password = req.body.password;
    //   const role=req.body.role

    
    //   try {
       
    //     const existingUser = await userCollectionUser.findOne({ email: email });
    
    //     if (existingUser) {
    //       return res.json({ error: true, message: 'User already exists' });
    //     }
    
   
    //     const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    //     const newUser = await userCollectionUser.insertOne({
    //       email: email,
    //       password: hashedPassword,
    //       role: role,
    //       name: name

    //     });
      
    //     const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
    //     return res.json({ token: token });
    //   } catch (error) {
    //     console.error('Error creating a new user:', error);
    //     return res.status(500).json({ error: true, message: 'Internal server error' });
    //   }
    // });

    app.post('/users', async (req, res) => {
      const email = req.body.email;
      const phoneNumber = req.body.phoneNumber;
      const name = req.body.name;
      const password = req.body.password;
      const role = req.body.role;
    
      try {
        let existingUser;
    
        if (email) {
          existingUser = await userCollectionUser.findOne({ email: email });
        } else if (phoneNumber) {
          existingUser = await userCollectionUser.findOne({ phoneNumber: phoneNumber });
        } else {
          return res.json({ error: true, message: 'Email or phone number is required' });
        }
    
        if (existingUser) {
          return res.json({ error: true, message: 'User already exists' });
        }
    
        const hashedPassword = await bcrypt.hash(password, saltRounds);
    
        const newUser = await userCollectionUser.insertOne({
          email: email,
          phoneNumber: phoneNumber,
          password: hashedPassword,
          role: role,
          name: name
        });
    
        const token = jwt.sign({ email: email, phoneNumber: phoneNumber }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
        return res.json({ token: token });
      } catch (error) {
        console.error('Error creating a new user:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
      }
    });
    
  


    // app.post('/login', async (req, res) => {
    //   const email = req.body.email;
    //   const password = req.body.password;
    
    //   try {

    //     const user = await userCollectionUser.findOne({ email: email });
    //     console.log(user)
    
    //     if (!user) {
    //       return res.json({ error: true, message: 'Invalid email or password' });
    //     }
   
    //     const passwordMatch = await bcrypt.compare(password, user.password);
    
    //     if (!passwordMatch) {
    //       return res.json({ error: true, message: 'Invalid email or password' });
    //     }
    
      
    //     const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
    //     return res.json({ token: token , user: user});
    //   } catch (error) {
    //     console.error('Error during login:', error);
    //     return res.status(500).json({ error: true, message: 'Internal server error' });
    //   }
    // });

   
    app.post('/login', async (req, res) => {
      const phoneNumber = req.body.phoneNumber; // Get the phone number from the request
      const password = req.body.password;
    
      try {
        const user = await userCollectionUser.findOne({ phoneNumber: phoneNumber });
        console.log(user);
    
        if (!user) {
          return res.json({ error: true, message: 'Invalid phone number or password' });
        }
    
        const passwordMatch = await bcrypt.compare(password, user.password);
    
        if (!passwordMatch) {
          return res.json({ error: true, message: 'Invalid phone number or password' });
        }
    
        const token = jwt.sign({ phoneNumber: phoneNumber }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
        return res.json({ token: token, user: user });
      } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ error: true, message: 'Internal server error' });
      }
    });
    


  


    app.post("/postproduct",async(req,res)=>{
      const body=req.body
      const result=await allproducts.insertOne(body)
      res.send(result)
    
      
      console.log(body)
    })

    app.post('/carts', async (req,res)=>{
      const item=req.body
      console.log(item)
      const result=await booking.insertOne(item)
      res.send(result)
      })

      

    const verifyJWT=(req,res,next  )=>{
      const authorization=req.headers.authorization
      if(!authorization){
        return res.status(401).send({error: true , message: "Unauthorized Access"})
      }
      console.log(authorization)
      // /token verify
      const token=authorization.split(' ')[1]
      console.log(token)
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
          return res.status(401).send({error: true , message: "Unauthorized Access"})
        }
        req.decoded =decoded
        next()  
      })}



    app.get("/allproducts/:email",verifyJWT,async(req,res)=>{
    

      const decodedEmail=req.decoded.email
  console.log(decodedEmail)
  const email = req.params.email;
  if(email !== decodedEmail){
    return res.status(403)
    .send({error: true, message: 'Forbidden Access'})
  }
  const query={Email: email}
  const cursor=allproducts.find(query)
  const result=await cursor.toArray()
  res.send(result)

     
      
    
    })
    app.get("/allproducts",async(req,res)=>{
   
      const result=await allproducts.find().toArray()
      res.send(result)
    
    
    })


    app.get('/favs/:email',verifyJWT,async(req,res)=>{
      const decodedEmail=req.decoded.email
      console.log(decodedEmail)
      const email = req.params.email;
      if(email !== decodedEmail){
        return res.status(403)
        .send({error: true, message: 'Forbidden Access'})
      }
      const query={Bookedby: email}
      const cursor=booking.find(query)
      const result=await cursor.toArray()
      res.send(result)
    })
    app.delete('/deleteCart/:id',async (req,res)=>{
      const id=req.params.id
      const query={_id: new ObjectId(id) }
      const result =await booking.deleteOne(query);
      res.send(result)
    })

    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
    
      const body = req.body;
  
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
        
      
          roomsize:body.roomsize,
     
          start:body.start,
          Enddata:body.Enddata,
          rent:body.rent,
          number:body.number,
          Description:body.Description
        },
      };
      const result = await allproducts.updateOne(filter, updateDoc);
      res.send(result);
    });


    app.delete('/deleteProperty/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await allproducts.deleteOne(query);
      res.send(result);
    })




    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send('hunter is running')
})

app.listen(port ,()=>{
    console.log(`car doctor is running on ${port}`)
})