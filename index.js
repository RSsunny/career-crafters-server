const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt=require('jsonwebtoken')
const cookiparser=require('cookie-parser')
require('dotenv').config()
const app=express()
const port=process.env.PORT||5000

// parsser
app.use(cookiparser())
app.use(cors({
    origin:['http://localhost:5173'],
    credentials:true

}))
app.use(express.json())

// custom Midddleware

const verifyToken=async(req,res,next)=>{
    const token=req.cookies.token
    if(!token){
        return res.status(401).send({message:'unAuthorized'})
    }
    jwt.verify(token,process.env.ACCESS_SECRETS_TOKEN,(err,decoded)=>{
        if(err){
            return res.status(401).send({message:'unAuthorized'})
        }

        req.user=decoded
        next()
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l4lgqi1.mongodb.net/?retryWrites=true&w=majority`;

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
    //   await client.connect();
      // Send a ping to confirm a successful connection



      app.post('/jwt',async(req,res)=>{
        try{
        const data=req?.body
        const token=jwt.sign(data,process.env.ACCESS_SECRETS_TOKEN,{expiresIn:'10s'})
        res.cookie('token',token,{
            httpOnly:true,
            secure:false
        }).send({message:'success'})
        
        }
        catch(err){
            console.log(err);
        }
      })


      app.post('/userlogout',async(req,res)=>{
        const data=req.body
        res.clearCookie('token',{maxAge:0}).send({success:true})
      })



      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    }
  }
  run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send("server runing...")
})
app.listen(port,()=>{
    console.log(`server running : ${port}`);
})

