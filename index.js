const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookiparser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// parsser
app.use(cookiparser())
// app.use(cors({
//     origin:['http://localhost:5173','https://gregarious-taffy-5c03fc.netlify.app'],
//     credentials:true,
//     optionSuccessStatus:200,

// }))

const corsOptions = {
  origin: [
    "https://gregarious-taffy-5c03fc.netlify.app",
    "http://localhost:5173",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// custom Midddleware

const verifyToken = async (req, res, next) => {
  const token=req.cookies?.token
  
  if (!token) {
    return res.status(401).send({ message: "unAuthorized" });
  }
  jwt.verify(token, process.env.ACCESS_SECRETS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unAuthorized" });
    }

    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l4lgqi1.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //   await client.connect();
    // Send a ping to confirm a successful connection

    const jobCollection = client.db("jobtDB").collection("job");
    const bidsCollection = client.db("jobtDB").collection("bids");

    app.get("/api/v1/jobs", async (req, res) => {
      try {
        let queryobj = {};
        const email = req.query?.email;

        if (email) {
          queryobj.email = email;
        }
        const result = await jobCollection.find(queryobj).toArray();
        res.send(result);
      } catch (err) {
        res.send({ message: "data Not Found" });
      }
    });



    app.get(`/api/v1/jobs/:id`,verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        
        const result = await jobCollection.findOne(query);
        res.send(result);
      } catch (err) {
        res.send({ message: "data Not Found" });
      }
    });

    app.post("/api/v1/jobs", async (req, res) => {
      try {
        const job = req.body;
        const result = await jobCollection.insertOne(job);
        res.send(result);
      } catch (err) {
        res.send({ message: "data Not Found" });
      }
    });


    app.patch("/api/v1/jobs/:id",verifyToken, async (req, res) => {
      try {
        const id=req.params.id
        const query={_id:new ObjectId(id)}
        const job = req.body;
        const options = { upsert: true };
        const updateDoc={
          $set:job
        }
        const result = await jobCollection.updateOne(query,updateDoc,options);
        res.send(result);
      } catch (err) {
        res.send({ message: "data Not Found" });
      }
    });


    app.delete("/api/v1/jobs/:id",verifyToken, async (req, res) => {
      try {
        const id=req.params.id
        const query={_id:new ObjectId(id)}
        const result = await jobCollection.deleteOne(query);
        res.send(result);
      } catch (err) {
        res.send({ message: "data Not Found" });
      }
    });



    app.get("/api/v1/bids",verifyToken, async (req, res) => {
      try {

       
        if(req.user?.email !==req.query?.youremail && req.user?.email !==req.query?.owneremail ){
          return res.status(403).send({message:"forbiden"})
        }

        let queryobj = {};
        const youremail = req.query?.youremail;
        const owneremail = req.query?.owneremail;

        if (youremail) {
          queryobj.youremail = youremail;
        }
        if (owneremail) {
          queryobj.owneremail = owneremail;
        }
        console.log(queryobj);
        const result = await bidsCollection.find(queryobj).toArray();
        res.send(result);
      } catch (err) {
        res.send([]);
      }
    });

    app.post("/api/v1/bids",verifyToken, async (req, res) => {
      try {
        const bids = req.body;
        const result = await bidsCollection.insertOne(bids);
        res.send(result);
      } catch (err) {
        res.send({ message: "data Not Found" });
      }
    });

    app.patch("/api/v1/bids/:id",verifyToken, async (req, res) => {
      try {
        const id = req.params.id;

        const query = { _id: new ObjectId(id) };

        const options = { upsert: true };
        const update = req.body;

        console.log("hfdh", update);
        const updateDoc = {
          $set: update,
        };
        const result = await bidsCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      } catch (err) {
        res.send([]);
      }
    });

    app.post("/jwt", async (req, res) => {
      const tokend=req.user
      
      const data = req?.body;

      const token = jwt.sign(data, process.env.ACCESS_SECRETS_TOKEN, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ message: "success" });
    });

    app.post("/userlogout", async (req, res) => {
      const data = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server runing...");
});
app.listen(port, () => {
  console.log(`server running : ${port}`);
});
