const { Handler } = require('@netlify/functions');
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  interests: [String],
  topics: [String],
});

const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Log the client context to debug
    console.log('Client Context:', context.clientContext);

    const { name, email, interests, topics } = JSON.parse(event.body);

    // Check for user in the client context
    const user = context.clientContext && context.clientContext.user;
    if (!user || !user.sub) {
      console.error('User object or sub is missing:', user);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is missing or invalid' }),
      };
    }

    const userId = user.sub;

    // Connect to the database
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Update or insert user profile
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { name, email, interests, topics },
      { upsert: true, new: true }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Profile updated successfully.', data: updatedProfile }),
    };
  } catch (error) {
    console.error('Error saving user profile:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save user profile.', details: error.message }),
    };
  } finally {
    await mongoose.disconnect();
  }
};

exports.handler = handler;
