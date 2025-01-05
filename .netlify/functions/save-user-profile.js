const mongoose = require('mongoose');

// Define MongoDB URI (ensure this is set in your Netlify environment variables)
const uri = process.env.MONGODB_URI;

// Define the schema and model
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
    // Parse incoming data
    const { name, email, interests, topics } = JSON.parse(event.body);
    const userId = context.clientContext.user.sub;

    if (!userId) {
      throw new Error('User ID is missing from the context.');
    }

    // Connect to MongoDB
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Upsert the user profile
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
      body: JSON.stringify({ error: 'Failed to save user profile.' }),
    };
  } finally {
    await mongoose.disconnect();
  }
};