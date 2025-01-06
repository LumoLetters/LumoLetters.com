//save-user-profile.js

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
    const { name, email, interests, topics } = JSON.parse(event.body);
    const userId = context.clientContext.user.sub;

    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

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
