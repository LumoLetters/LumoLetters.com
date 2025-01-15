// netlify/functions/save-user-profile.js

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './netlify/functions/.env' }); //Explicitly define dotenv location

const uri = process.env.MONGODB_URI; // Using process.env
const dbName = process.env.DATABASE_NAME; // Using process.env

let UserProfile; // Declare the model outside the handler

if (mongoose.models.UserProfile) {
    UserProfile = mongoose.model('UserProfile'); // If the model has already been compiled, use it
} else {
    // Create the schema with the interests and topics fields
    const userProfileSchema = new mongoose.Schema({
        user_id: { type: String, required: true },
        date: { type: Date, default: Date.now }, // Default to current time
        onboardingComplete: { type: Boolean, default: false }, // Add the onboardingComplete field
        interests: { type: [String], default: [] }, // Array of strings for interests
        topics: { type: [String], default: [] }, // Array of strings for topics
    }, { strict: false });
    // Create a model from the schema
    UserProfile = mongoose.model('UserProfile', userProfileSchema);
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(dbName);
        const usersCollection = db.collection('user-profile');

        // Parse the incoming data
        const data = JSON.parse(event.body);
        console.log('Received Data:', data);
        // Ensure onboardingComplete, interests, and topics are passed or default to empty values
        const { user_id, onboardingComplete = false, interests = [], topics = [], ...otherData } = data;

        // Create a new user profile object with onboardingComplete, interests, and topics
        const userProfile = new UserProfile({
            user_id,
            onboardingComplete,
            interests,
            topics,
            ...otherData // Include any additional fields (like name, email, etc.)
        });

        // Insert the new user profile into the MongoDB collection
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
