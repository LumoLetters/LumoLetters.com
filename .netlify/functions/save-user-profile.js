const { MongoClient } = require("mongodb");
    
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

exports.handler = async (event, context) => {
  try {
     console.log("Attempting to connect")
    await client.connect();
      console.log("Successfully Connected");
      const db = client.db("lumoletters");
    const collection = db.collection("user-profiles");
    const userData = JSON.parse(event.body);

    // Add a document to the collection.
    const result = await collection.updateOne(
    { userId: context.clientContext.user.sub }, // Find by user ID
       { $set: { ...userData, userId: context.clientContext.user.sub } }, // Add or update the data, add the ID
    { upsert: true } // Update if exists, otherwise create
     );
     console.log("Data was saved", result);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User profile saved successfully", result: result }),
    };
  } catch (error) {
      console.error("Error connecting to MongoDB:", error);
       return {
         statusCode: 500,
        body: JSON.stringify({ error: "Failed to save to MongoDB", message: error.message }),
      };
  } finally {
     console.log("Closing Connection");
   await client.close();
  }
};