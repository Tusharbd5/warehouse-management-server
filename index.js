const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.flgqo61.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const itemsCollection = client.db('warehouseDb').collection('item');
        const userEntry = client.db('warehouseDb').collection('user_entry');

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
        app.get('/user-entry', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = userEntry.find(query);
            const entry = await cursor.toArray();
            res.send(entry);
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