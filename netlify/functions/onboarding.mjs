// netlify/functions/onboarding.mjs
import { User, connectToDatabase } from './db-connect.mjs';
import { verifyTokenAndGetSub } from './lib/auth-utils.mjs';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: `HTTP method ${event.httpMethod} not allowed. Only POST is accepted.` })
    };
  }

  try {
    await connectToDatabase();
    const auth0Id = await verifyTokenAndGetSub(event);

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing request body' }) };
    }

    const bodyData = JSON.parse(event.body);
    const { step, data } = bodyData;

    if (!step || typeof data !== 'object' || data === null) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid payload structure: "step" and "data" (object) are required.' }) };
    }

    let stepData = data;

    if (step === 'interests' && data.interests) {
      stepData = data.interests;
    }

    const update = {
      profileStep: step,
      [`onboarding.${step}`]: stepData
    };

    if (step === 'address') {
      const { street, city, state, zipCode, country, specialInstructions } = data;
      update.address = {
        street: street || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        country: country || 'US',
        specialInstructions: specialInstructions || ''
      };
    }

    if (typeof data.profileComplete === 'boolean') {
      update.profileComplete = data.profileComplete;
    } else if (step === 'complete') {
      update.profileComplete = true;
    }

    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $set: update },
      { new: true, runValidators: true }
    ).select('profileComplete profileStep onboarding address');

    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found. Profile might not have been initialized.' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(user),
    };

  } catch (error) {
    console.error('Onboarding function error:', error.message, error.stack);
    const statusCode = error.statusCode || 500;
    // The 'headers' key has been removed from the error response below
    return {
      statusCode,
      body: JSON.stringify({ 
        error: error.message || 'An internal server error occurred during onboarding update.'
      }),
    };
  }
}