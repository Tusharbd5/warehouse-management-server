const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        req.decoded = decoded;
        next();
    })

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.flgqo61.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const itemsCollection = client.db('warehouseDb').collection('item');
        const userEntry = client.db('warehouseDb').collection('user_entry');

        // Auth
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '7d'
            });
            res.send({ accessToken });
        });

        // Getting all data from database
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = itemsCollection.find(query);
            const product = await cursor.toArray();
            res.send(product);
        });

        // Insert one data to database
        app.post('/product', async (req, res) => {
            const newProduct = req.body;
            const result = await itemsCollection.insertOne(newProduct);
            res.send(result);
        })

        // Finding products by id
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await itemsCollection.findOne(query);
            res.send(result);
        });

        // Updating products information
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const updatedProduct = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedProduct.quantity
                }
            };
            const result = await itemsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        // Deleting a product
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await itemsCollection.deleteOne(query);
            res.send(result);
        });

        // User entry collection
        app.get('/user-entry', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = userEntry.find(query);
                const entry = await cursor.toArray();
                res.send(entry);
            }
            else {
                res.status(403).send({ message: 'forbidden access' });
            }
        })

        app.post('/user-entry', async (req, res) => {
            const entry = req.body;
            const result = await userEntry.insertOne(entry);
            res.send(result);
        })


    }
    finally {

    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('Starting server')
});

app.listen(port, () => {
    console.log('Listening to port', port);
});