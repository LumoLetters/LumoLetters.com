const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './netlify/functions/.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
let Letter;

if(mongoose.models.Letter){
    Letter = mongoose.model('Letter')
}else {
    const letterSchema = new mongoose.Schema({
             _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
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
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }
      const authHeader = event.headers.authorization;
      console.log("authHeader", authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Unauthorized: No token provided' }),
        };
    }
    const token = authHeader.split(' ')[1];
      console.log("token", token);
        let decodedToken;
      try{
          decodedToken = jwt.decode(token);
           console.log("decodedToken", decodedToken);
      }catch(e){
            return {
               statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized: Invalid token.' }),
           }
      }

    if (!decodedToken || !decodedToken.sub) {
          console.log("decoded token does not have the sub field")
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Unauthorized: Invalid user ID in token.' }),
        };
    }

    const userId = decodedToken.sub;
    console.log("userId", userId)

    try {
        await mongoose.connect(MONGODB_URI, { dbName: DATABASE_NAME });
        const userLetters = await Letter.find({
            $or: [{ sender_id: userId }, { receiver_id: userId }],
        }).sort({ sent_at: -1 });

        return {
            statusCode: 200,
            body: JSON.stringify({ data: userLetters }),
        };
    } catch (error) {
        console.error('Error fetching user letters:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching user letters', error: error.message }),
        };
    } finally {
       await mongoose.disconnect();
    }
};