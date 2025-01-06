const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './netlify/functions/.env' });

exports.handler = async function (event, context) {
  // Load variables from .env file
  const uri = process.env.MONGODB_URI; // MongoDB connection string
  const dbName = process.env.DB_NAME; // Database name
  const collectionName = process.env.COLLECTION_NAME; // Collection name

  console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('COLLECTION_NAME:', process.env.COLLECTION_NAME);
  // Create a new MongoClient instance
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect(); // Connect to MongoDB

    // Access the database and collection
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    if (event.httpMethod === 'POST') {
      // Parse incoming data
      const data = JSON.parse(event.body);

      // Insert into MongoDB
      const result = await collection.insertOne(data);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Data saved!', result }),
      };
    } else if (event.httpMethod === 'GET') {
      // Fetch data
      const users = await collection.find({}).toArray();
      return {
        statusCode: 200,
        body: JSON.stringify(users),
      };
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method not allowed' }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error', error: error.message }),
    };
  } finally {
    await client.close(); // Ensure MongoClient is closed
  }
};
