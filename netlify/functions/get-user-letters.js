// .netlify/functions/get-user-letters.js

const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  const userId = event.queryStringParameters.userId;
    const client = new MongoClient(process.env.MONGODB_URI);
      try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DATABASE);
        const letters = db.collection('letters');
          const userLetters = await letters.find({ user_id: userId}).toArray();
       return {
            statusCode: 200,
            body: JSON.stringify({ data: userLetters })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching user letters', error: error.message })
        };
    } finally {
    await client.close();
  }
}