const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config(); //Include dotenv

const MONGODB_URI = process.env.MONGODB_URI; //Using process.env
const DATABASE_NAME = process.env.DATABASE_NAME;  //Using process.env

let UserProfile; // Declare the model outside the handler

if (mongoose.models.UserProfile) {
    UserProfile = mongoose.model('UserProfile'); // If the model has already been compiled, use it
} else {
    // Create the schema
    const userProfileSchema = new mongoose.Schema({
        user_id: { type: String, required: true },
        date: { type: Date, required: true },
    }, { strict: false });
    // Create a model from the schema
     UserProfile = mongoose.model('UserProfile', userProfileSchema);
}

exports.handler = async (event, context) => {
    console.log("MONGODB_URI:", MONGODB_URI); //Using process.env
    console.log("DATABASE_NAME:", DATABASE_NAME); //Using process.env
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
        const client = new MongoClient(MONGODB_URI); //Use MongoClient method to connect to database
        await client.connect(); //Connect to Database

        const db = client.db(DATABASE_NAME); //Access the database
        const usersCollection = db.collection('user-profile') //Select correct collection


        const data = JSON.parse(event.body);
         // Create a new document in the users collection using the Mongoose model
       const userProfile = new UserProfile(data); // Create a model instance
       await usersCollection.insertOne(userProfile);


      return {
        statusCode: 200,
          body: JSON.stringify({ message: 'User data saved to MongoDB', data: userProfile }),
      };
   } catch (error) {
       console.error('Error saving user data:', error);
      return {
        statusCode: 500,
          body: JSON.stringify({ error: 'Failed to save user data', details: error.message }),
        };
    }
};