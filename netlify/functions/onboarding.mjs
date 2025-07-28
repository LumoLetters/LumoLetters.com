// netlify/functions/onboarding.mjs
import { User, connectToDatabase } from './db-connect.mjs';
import { verifyTokenAndGetSub } from './lib/auth-utils.mjs'; // USE SHARED AUTH UTILITY

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : (process.env.URL || '*'),
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // This function seems to only handle POST
  'Content-Type': 'application/json'
};

export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  // This function primarily handles POST requests for updating onboarding steps
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: `HTTP method ${event.httpMethod} not allowed. Only POST is accepted.` })
    };
  }

  try {
    await connectToDatabase();
    const auth0Id = await verifyTokenAndGetSub(event); // Use shared utility

    if (!event.body) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing request body' }) };
    }

    const bodyData = JSON.parse(event.body);
    const { step, data } = bodyData;

    if (!step || typeof data !== 'object' || data === null) { // data should be an object
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid payload structure: "step" and "data" (object) are required.' }) };
    }

    // Prepare the update object for MongoDB
    const update = {
      profileStep: step,
      // Dynamically set the onboarding step data, e.g., 'onboarding.welcome', 'onboarding.address'
      [`onboarding.${step}`]: data 
    };

    // If the step is 'address', also update the root-level address object
    if (step === 'address') {
      const { street, city, state, zipCode, country, specialInstructions } = data; // data is onboarding.address content
      update.address = {
        street: street || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '', 
        country: country || 'US', // Default country
        specialInstructions: specialInstructions || ''
      };
    }

    // If 'profileComplete' is explicitly passed in the data for any step (e.g., the 'complete' step)
    if (typeof data.profileComplete === 'boolean') {
      update.profileComplete = data.profileComplete;
    } else if (step === 'complete') { // Default for 'complete' step if not specified
      update.profileComplete = true;
    }


    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $set: update },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    ).select('profileComplete profileStep onboarding address'); // Select fields to return

    if (!user) {
      // This case should ideally not happen if auth0Id is valid and user was created by auth-hook/auth-user
      return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'User not found. Profile might not have been initialized.' }) };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(user),
    };
  } catch (error) {
    console.error('Onboarding function error:', error.message, error.stack);
    const statusCode = error.statusCode || 500;
    return {
      statusCode,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: error.message || 'An internal server error occurred during onboarding update.',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }),
    };
  }
}