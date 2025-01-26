// .netlify/functions/save-user-letter.js

const { MongoClient, ObjectId } = require('mongodb');


exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db(process.env.MONGODB_DATABASE);
        const lettersCollection = db.collection('letters');

        const { user_id, letter, letterId} = JSON.parse(event.body);
        const letterToSave = {
            user_id: user_id,
            letter: letter,
             date: new Date(),
        }
        if(letterId){
           const result = await lettersCollection.updateOne({ _id: new ObjectId(letterId) }, { $set: letterToSave });
               return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Letter updated in MongoDB', result })
              };

        }else{
            const letterId = new ObjectId();
               const result = await lettersCollection.insertOne({
                   _id: letterId,
                    user_id: user_id,
                    letter: letter,
                     date: new Date(),
                });
              return {
                    statusCode: 200,
                   body: JSON.stringify({ message: 'Letter saved to MongoDB', result })
               };
            }
    } catch (error) {
        console.error('Error saving letter data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to save letter data', details: error.message }),
        };
    }
};