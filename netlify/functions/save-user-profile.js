const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: './netlify/functions/shared/.env' }); // Explicitly define dotenv location


const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;

let UserProfile;

if (mongoose.models.UserProfile) {
    UserProfile = mongoose.model('UserProfile');
} else {
    const userProfileSchema = new mongoose.Schema({
        user_id: { type: String, required: true },
        date: { type: Date, default: Date.now },
        onboardingComplete: { type: Boolean, default: false },
        interests: { type: [String], default: [] },
        topics: { type: [String], default: [] },
        name: { type: String },
        email: { type: String },
        dob: { type: String },
        address: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            zip: { type: String },
        },
        paymentPlan: { type: String },
        paymentMethod: { type: String },
        // Add a catch all for any other data being passed, since strict is set to false
    }, { strict: false });

    UserProfile = mongoose.model('UserProfile', userProfileSchema);
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
         const client = new MongoClient(MONGODB_URI);
        await client.connect();
         const db = client.db(DATABASE_NAME);
        const usersCollection = db.collection('user-profile'); // Get your user profile collection here
           const lettersCollection = db.collection('letters'); // Get your letters collection here

        const data = JSON.parse(event.body);
        console.log('Received Data:', data);

        const { 
            user_id, 
            onboardingComplete,
            name, 
            email, 
            address,
            paymentPlan, 
            paymentMethod,
             dob,
            interests,
            topics,
            generateLetter, // Check that you are using this variable to trigger letter generation
             ...otherData
        } = data;

        const existingUser = await usersCollection.findOne({ user_id: user_id });
        
        let userProfile = {
            user_id
        };


        if (existingUser) {
            // Use a more reliable way to update fields without overwriting other existing data
            const updateObject = { $set: {} };

            if (onboardingComplete !== undefined) updateObject.$set.onboardingComplete = onboardingComplete;
             if (name !== undefined) updateObject.$set.name = name;
            if (email !== undefined) updateObject.$set.email = email;
            if (paymentPlan !== undefined) updateObject.$set.paymentPlan = paymentPlan;
              if (paymentMethod !== undefined) updateObject.$set.paymentMethod = paymentMethod;
            if (dob !== undefined) updateObject.$set.dob = dob;
             if (interests !== undefined) updateObject.$set.interests = interests;
               if (topics !== undefined) updateObject.$set.topics = topics;

                if (address) {
                 if (address.street !== undefined) updateObject.$set['address.street'] = address.street;
                 if (address.city !== undefined) updateObject.$set['address.city'] = address.city;
                 if (address.state !== undefined) updateObject.$set['address.state'] = address.state;
                    if (address.zip !== undefined) updateObject.$set['address.zip'] = address.zip;
               }
            // Conditionally include fields from otherData
           for (const key in otherData) {
                 updateObject.$set[key] = otherData[key];
            }

                if (Object.keys(updateObject.$set).length > 0) {
                  const result = await usersCollection.updateOne({ user_id: user_id }, updateObject);
                  console.log('Update Result:', result);
                   // Fetch updated document for return
                        const updatedUser = await usersCollection.findOne({user_id: user_id});
                       if(generateLetter){ //Check that the if statement is correctly targeting your boolean
                            const letterId = new ObjectId();
                           const defaultLetter = `This is a sample letter generated for you. You can create your own content here!`
                            console.log("Attempting to insert letter");
                               await lettersCollection.insertOne({ // Verify your insert is working as expected
                                    _id: letterId,
                                    user_id: user_id,
                                    letter: defaultLetter,
                                    date: new Date(),
                                });
                               console.log("Letter inserted!")
                        }
                        return {
                            statusCode: 200,
                           body: JSON.stringify({ message: 'User data updated in MongoDB', data: updatedUser }),
                       };
                 } else {
                      if(generateLetter){
                             const letterId = new ObjectId();
                             const defaultLetter = `This is a sample letter generated for you. You can create your own content here!`
                                 await lettersCollection.insertOne({
                                        _id: letterId,
                                        user_id: user_id,
                                        letter: defaultLetter,
                                        date: new Date(),
                                    });
                        }
                       return {
                           statusCode: 200,
                            body: JSON.stringify({ message: 'No updates needed', data: existingUser }),
                         };
                 }

            } else {
                // Insert new user
                userProfile = {
                    user_id,
                    onboardingComplete,
                    name,
                    email,
                    address: address || { street: '', city: '', state: '', zip: '' },
                    paymentPlan,
                    paymentMethod,
                    dob,
                    interests: interests || [],
                    topics: topics || [],
                   ...otherData
                   
                };
             if(generateLetter){ //Check that the if statement is correctly targeting your boolean
                   const letterId = new ObjectId();
                     const defaultLetter = `This is a sample letter generated for you. You can create your own content here!`
                       await lettersCollection.insertOne({  // Verify your insert is working as expected
                            _id: letterId,
                            user_id: user_id,
                            letter: defaultLetter,
                            date: new Date(),
                        });
                }
                const result =  await usersCollection.insertOne(userProfile);
                  console.log('Insert Result:', result);
                    return {
                        statusCode: 200,
                        body: JSON.stringify({ message: 'User data saved to MongoDB', data: userProfile }),
                  };
            }

    } catch (error) {
        console.error('Error saving user data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to save user data', details: error.message }),
        };
    }
};