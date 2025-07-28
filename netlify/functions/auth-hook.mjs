// netlify/functions/auth-hook.mjs

import { User } from './db-connect.mjs';
import { connectToDatabase } from './db-connect.mjs';

export async function handler(event) {
  // Verify it's coming from Auth0
  if (event.headers['x-auth0-hook'] !== 'post-user-registration') {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden' })
    };
  }

  try {
    await connectToDatabase();
    const userData = JSON.parse(event.body);

    // Create minimal profile for onboarding
    await User.create({
      auth0Id: userData.user_id,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      profileComplete: false,
      profileStep: 'welcome'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}