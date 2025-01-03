const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI; // Use environment variable, not hardcoded value
const client = new MongoClient(uri);

exports.handler = async (event, context) => {
  try {
    await client.connect();
    const db = client.db("lumoletters"); // Replace with your database name
    console.log("Successfully connected to MongoDB!");

    // Test query (optional)
    const collection = db.collection("test-collection"); // Replace with your collection name if any
     const testDoc = await collection.findOne({});
    console.log("found a document:", testDoc)

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Connection successful!", data: testDoc }),
    };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to connect to MongoDB", message: error.message }),
    };
  } finally {
    await client.close();
  }
};