const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

exports.handler = async (event, context) => {
  try {
    
     console.log("Attempting to connect")
    await client.connect();
    console.log("Successfully Connected");
    
     return {
      statusCode: 200,
       body: JSON.stringify({message: "Connection Successful!"}),
    };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to connect to MongoDB", message: error.message }),
    };
  } finally {
     console.log("Closing Connection");
    await client.close();
  }
};