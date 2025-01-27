// .netlify/functions/save-user-letter.js

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
require('dotenv').config({ path: './netlify/functions/.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;

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
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        await mongoose.connect(MONGODB_URI, { dbName: DATABASE_NAME });
        const authHeader = event.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized: No token provided' }),
            };
        }
         const token = authHeader.split(' ')[1];
          let decodedToken;
        try{
             decodedToken = jwt.decode(token);
        }catch(e){
           return {
              statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized: Invalid token.' }),
           }
        }


        if (!decodedToken || !decodedToken.sub) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized: Invalid user ID in token.' }),
            };
        }

        const userId = decodedToken.sub;
        const { letter, letterId, receiver_id } = JSON.parse(event.body);
        const letterToSave = {
            sender_id: userId,
             receiver_id: receiver_id,
            content: letter,
            sent_at: new Date(),
            is_read: false,
            is_default: false,
        };
        if (letterId) {
             const result = await Letter.updateOne({ _id: new ObjectId(letterId) }, { $set: letterToSave });
             return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Letter updated in MongoDB', result }),
            };
        } else {
           const newLetter = new Letter({
               ...letterToSave
           })
                await newLetter.save();

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Letter saved to MongoDB', result: newLetter }),
            };
        }
    } catch (error) {
        console.error('Error saving letter data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to save letter data', details: error.message }),
        };
    } finally {
         await mongoose.disconnect();
    }
};