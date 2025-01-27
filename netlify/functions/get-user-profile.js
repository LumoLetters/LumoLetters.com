//netlify/functions/get-user-profile.js

const mongoose = require('mongoose');
require('dotenv').config({ path: './netlify/functions/.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;

let UserProfile;

if (mongoose.models.UserProfile) {
    UserProfile = mongoose.model('UserProfile');
} else {
    const userProfileSchema = new mongoose.Schema({
        user_id: { type: String, required: true, unique: true },
    }, { strict: false });
    UserProfile = mongoose.model('UserProfile', userProfileSchema);
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
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
        await mongoose.connect(MONGODB_URI, { dbName: DATABASE_NAME });
        const userProfile = await UserProfile.findOne({ user_id: userId });

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
    } finally {
        await mongoose.disconnect();
    }
};