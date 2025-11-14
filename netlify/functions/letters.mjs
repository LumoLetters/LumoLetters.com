// netlify/functions/letters.mjs
import { connectToDatabase, Letter, User } from './db-connect.mjs';
import { verifyTokenAndGetSub } from './lib/auth-utils.mjs'; // IMPORT THE NEW UTILITY

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};


/**
 * Get user's MongoDB _id from Auth0 sub
 * @param {string} auth0Sub - Auth0 user ID (sub claim from JWT)
 * @returns {Promise<string>} - MongoDB user _id
 * @throws {Error} - If user not found in DB
 */
async function getMongoUserId(auth0Sub) {
  const user = await User.findOne({ auth0Id: auth0Sub }).select('_id').lean();
  if (!user) {
    const error = new Error('User not found in database.');
    error.statusCode = 404;
    throw error;
  }
  return user._id.toString();
}


export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  try {
    await connectToDatabase();

    // VERIFY TOKEN and get Auth0 User ID (sub)
    const auth0Sub = await verifyTokenAndGetSub(event);
    
    // Get MongoDB user _id
    const mongoUserId = await getMongoUserId(auth0Sub);

    const { httpMethod, body, queryStringParameters } = event;

    if (httpMethod === 'GET') {
      if (queryStringParameters && queryStringParameters.id) {
        const letter = await Letter.findOne({
          _id: queryStringParameters.id,
          userId: mongoUserId // Use MongoDB _id for query
        });
        
        if (!letter) {
          return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Letter not found' }) };
        }
        
        if (!letter.isRead) {
          letter.isRead = true;
          await letter.save();
        }
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(letter) };
      }
      
      const letters = await Letter.find({ userId: mongoUserId }) // Use MongoDB _id
        .sort({ sentDate: -1 })
        .limit(20);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(letters) };
    }
    
    if (httpMethod === 'PUT') {
      if (!queryStringParameters || !queryStringParameters.id) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Letter ID is required for PUT' }) };
      }
      if (!body) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Request body is required for PUT' }) };
      }
      
      const updateData = JSON.parse(body);
      const letter = await Letter.findOne({
        _id: queryStringParameters.id,
        userId: mongoUserId // Use MongoDB _id
      });
      
      if (!letter) {
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Letter not found for update' }) };
      }
      
      if (typeof updateData.isRead === 'boolean') {
        letter.isRead = updateData.isRead;
        await letter.save();
      }
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(letter) };
    }
    
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Method Not Allowed' }) };

  } catch (error) {
    console.error('Letters function error:', error.message, error.stack);
    const statusCode = error.statusCode || 500;
    return {
      statusCode,
      headers: CORS_HEADERS, // Ensure CORS headers on error too
      body: JSON.stringify({ message: error.message || 'An internal server error occurred.' })
    };
  }
}