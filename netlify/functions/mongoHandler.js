const mongoose = require('mongoose');
require('dotenv').config({ path: './netlify/functions/.env' });

// Mongoose Schema
const UserProfileSchema = new mongoose.Schema({
  name: String,
  email: String,
  interests: [String],
  topics: [String],
});

const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

let cachedDb = null;

// Function to connect to MongoDB
const connectToDatabase = async () => {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MongoDB URI is not defined');
  }

  await mongoose.connect(uri); // Removed deprecated options here

  cachedDb = mongoose.connection;
  return cachedDb;
};

exports.handler = async function (event, context) {
  try {
    // Ensure the DB connection is established
    const db = await connectToDatabase();

    // Handle POST request to save data
    if (event.httpMethod === 'POST') {
      const { name, email, interests, topics } = JSON.parse(event.body);

      // Create a new user profile or update an existing one
      const userProfile = new UserProfile({
        name,
        email,
        interests,
        topics,
      });

      const result = await userProfile.save();

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Data saved successfully', result }),
      };
    }

    // Handle GET request to fetch data
    else if (event.httpMethod === 'GET') {
      const users = await UserProfile.find({});
      return {
        statusCode: 200,
        body: JSON.stringify(users),
      };
    }

    // Handle unsupported methods
    else {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method not allowed' }),
      };
    }
  } catch (error) {
    console.error('Error in MongoDB operation:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error', error: error.message }),
    };
  }
};
