//get-user-profile.js

const mongoose = require('mongoose');

// Define MongoDB URI (ensure this is set in your Netlify environment variables)
const uri = process.env.MONGODB_URI;

// Define the schema and model (reuse the schema)
const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  interests: [String],
  topics: [String],
});
const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const userId = context.clientContext.user.sub;

    if (!userId) {
      throw new Error('User ID is missing from the context.');
    }

    // Connect to MongoDB
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Fetch the user profile
    const userProfile = await UserProfile.findOne({ userId });

    return {
      statusCode: 200,
      body: JSON.stringify({ data: userProfile || null }),
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch user profile.' }),
    };
  } finally {
    await mongoose.disconnect();
  }
};