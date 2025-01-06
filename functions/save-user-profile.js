//save-user-profile.js

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB URI from environment variables
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
    const { name, email, interests, topics } = JSON.parse(event.body);
    const userId = context.clientContext.user.sub;

    if (!userId) {
      throw new Error('User ID is missing from the context.');
    }

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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save user profile.', details: error.message }),
    };
  }
};
