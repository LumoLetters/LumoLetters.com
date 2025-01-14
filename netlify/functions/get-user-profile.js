const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './netlify/functions/.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;

let UserProfile; // Declare the model outside the handler

if (mongoose.models.UserProfile) {
    UserProfile = mongoose.model('UserProfile'); // If the model has already been compiled, use it
} else {
    // Create the schema
    const userProfileSchema = new mongoose.Schema({
        user_id: { type: String, required: true },
    }, { strict: false });
    // Create a model from the schema
     UserProfile = mongoose.model('UserProfile', userProfileSchema);
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') { // Correct http method
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const userId = event.queryStringParameters.userId;
    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'User ID is missing' }),
        };
    }

    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();

        const db = client.db(DATABASE_NAME);
        const usersCollection = db.collection('user-profile');

        const userProfile = await usersCollection.findOne({ user_id: userId });

        if (!userProfile) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'User profile not found' }),
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User data retrieved', data: userProfile }),
        };
    } catch (error) {
        console.error('Error fetching user data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch user data', details: error.message }),
        };
    }
};