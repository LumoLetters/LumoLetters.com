const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
require('dotenv').config({ path: './netlify/functions/shared/.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;

let UserProfile;

if (mongoose.models.UserProfile) {
    UserProfile = mongoose.model('UserProfile');
} else {
    const userProfileSchema = new mongoose.Schema({
        user_id: { type: String, required: true, unique: true },
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

let Letter;

if(mongoose.models.Letter){
    Letter = mongoose.model('Letter')
}else {
        const letterSchema = new mongoose.Schema({
            _id: { type: ObjectId, default: () => new ObjectId() },
                sender_id: { type: String, required: true },
                receiver_id: { type: String, required: true},
                 content: { type: String, required: true},
                sent_at: { type: Date, default: Date.now },
                is_read: { type: Boolean, default: false },
               is_default: {type: Boolean, default: false}
        })
    Letter = mongoose.model("Letter", letterSchema)
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        await mongoose.connect(MONGODB_URI, { dbName: DATABASE_NAME });

        const data = JSON.parse(event.body);
        console.log('Received Data:', data);

        const {
            user_id,
            onboardingComplete,
            name,
            email,
             dob,
            address,
            paymentPlan,
            paymentMethod,
              interests,
            topics,
              generateLetter,
            ...otherData
        } = data;

        let userProfile = await UserProfile.findOne({ user_id: user_id });

        if (userProfile) {
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
                 const result = await UserProfile.updateOne({user_id: user_id}, updateObject)
                   const updatedUser = await UserProfile.findOne({user_id: user_id})
                         if(generateLetter){
                           const defaultLetter = `This is a sample letter generated for you. You can create your own content here!`
                            console.log("Attempting to insert letter");
                            const newLetter = new Letter({
                                    sender_id: user_id,
                                    receiver_id: user_id,
                                     content: defaultLetter,
                                   is_default: true,
                             })
                             await newLetter.save()

                            console.log("Letter inserted!")
                        }
                    return {
                        statusCode: 200,
                        body: JSON.stringify({ message: 'User data updated in MongoDB', data: updatedUser }),
                    };
                } else {
                      if(generateLetter){
                            const defaultLetter = `This is a sample letter generated for you. You can create your own content here!`
                                const newLetter = new Letter({
                                    sender_id: user_id,
                                      receiver_id: user_id,
                                       content: defaultLetter,
                                  is_default: true,
                             })
                             await newLetter.save()
                        }
                    return {
                        statusCode: 200,
                        body: JSON.stringify({ message: 'No updates needed', data: userProfile }),
                    };
                }

        } else {
            const newUserProfile = new UserProfile({
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
                ...otherData,

            });
               if(generateLetter){
                           const defaultLetter = `This is a sample letter generated for you. You can create your own content here!`
                         const newLetter = new Letter({
                            sender_id: user_id,
                             receiver_id: user_id,
                            content: defaultLetter,
                              is_default: true,
                         })
                        await newLetter.save()
                }

            await newUserProfile.save();
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'User data saved to MongoDB', data: newUserProfile }),
            };
        }

    } catch (error) {
        console.error('Error saving user data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to save user data', details: error.message }),
        };
    } finally {
        await mongoose.disconnect();
    }
};