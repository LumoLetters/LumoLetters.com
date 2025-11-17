// netlify/functions/auth-user.mjs

import { connectToDatabase, User } from './db-connect.mjs';
import { verifyTokenAndGetSub } from './lib/auth-utils.mjs';

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : (process.env.URL || '*'),
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
  'Content-Type': 'application/json'
};

// GET: Retrieve user profile
async function getProfile(event) {
  console.log('🔍 Getting user profile...');
  
  const auth0Id = await verifyTokenAndGetSub(event);
  console.log('✅ Token verified for user:', auth0Id);
  
  console.log('🔌 Connecting to database...');
  await connectToDatabase();
  console.log('✅ Database connected');

  const profile = await User.findOne({ auth0Id }).select('-__v').lean();

  if (!profile) {
    console.log('❌ User profile not found for auth0Id:', auth0Id);
    const error = new Error('User profile not found.');
    error.statusCode = 404;
    throw error;
  }

  console.log('✅ Profile retrieved successfully');
  return {
    statusCode: 200,
    body: JSON.stringify(profile)
  };
}

// POST: Find or create user profile
async function findOrCreateProfile(event) {
  console.log('🔍 Finding or creating user profile...');
  
  const auth0Id = await verifyTokenAndGetSub(event);
  console.log('✅ Token verified for user:', auth0Id);
  
  if (!event.body) {
    const error = new Error('Request body is missing for POST.');
    error.statusCode = 400;
    throw error;
  }
  
  const { email, name } = JSON.parse(event.body);
  console.log('📧 User data:', { email, name: name || 'not provided' });

  if (!email) {
    const error = new Error('Email is required to find or create a profile.');
    error.statusCode = 400;
    throw error;
  }

  console.log('🔌 Connecting to database...');
  await connectToDatabase();
  console.log('✅ Database connected');

  let profile = await User.findOne({ auth0Id });

  if (profile) {
    console.log('✅ Existing user found');
    return {
      statusCode: 200,
      body: JSON.stringify({
        _id: profile._id.toString(),
        auth0Id: profile.auth0Id,
        email: profile.email,
        name: profile.name,
        profileComplete: profile.profileComplete,
        profileStep: profile.profileStep,
      })
    };
  }

  console.log('👤 Creating new user profile...');
  profile = await User.create({
    auth0Id,
    email,
    name: name || email.split('@')[0],
    profileStep: 'welcome',
    profileComplete: false,
    'subscription.status': 'inactive'
  });

  console.log('✅ New user profile created');
  return {
    statusCode: 201,
    body: JSON.stringify({
      _id: profile._id.toString(),
      auth0Id: profile.auth0Id,
      email: profile.email,
      name: profile.name,
      profileComplete: profile.profileComplete,
      profileStep: profile.profileStep
    })
  };
}

// PUT: Update user profile (full replacement)
async function updateProfile(event) {
  console.log('🔄 Updating user profile (PUT)...');
  
  const auth0Id = await verifyTokenAndGetSub(event);
  console.log('✅ Token verified for user:', auth0Id);

  if (!event.body) {
    const error = new Error('Request body is missing for PUT.');
    error.statusCode = 400;
    throw error;
  }
  
  const updates = JSON.parse(event.body);
  console.log('📝 Update data:', Object.keys(updates));

  console.log('🔌 Connecting to database...');
  await connectToDatabase();
  console.log('✅ Database connected');

  const profile = await User.findOneAndUpdate(
    { auth0Id },
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-__v');

  if (!profile) {
    const error = new Error('User profile not found for update.');
    error.statusCode = 404;
    throw error;
  }

  console.log('✅ Profile updated successfully');
  return {
    statusCode: 200,
    body: JSON.stringify(profile)
  };
}

// PATCH: Partial update user profile (for topics, interests, etc.)
async function patchProfile(event) {
  console.log('🔄 Patching user profile (PATCH)...');
  
  const auth0Id = await verifyTokenAndGetSub(event);
  console.log('✅ Token verified for user:', auth0Id);

  if (!event.body) {
    const error = new Error('Request body is missing for PATCH.');
    error.statusCode = 400;
    throw error;
  }
  
  const updates = JSON.parse(event.body);
  console.log('📝 Patch data:', Object.keys(updates));

  console.log('🔌 Connecting to database...');
  await connectToDatabase();
  console.log('✅ Database connected');

  // Build update object
  const updateData = {};
  
  // Handle userInterests (topics)
  if (updates.userInterests !== undefined) {
    updateData.userInterests = updates.userInterests;
    console.log('📚 Updating userInterests:', updates.userInterests);
  }

  // Handle address updates
  if (updates.address) {
    updateData.address = updates.address;
    console.log('📍 Updating address');
  }

  // Handle name updates
  if (updates.name) {
    updateData.name = updates.name;
    console.log('👤 Updating name');
  }

  // Handle subscription updates
  if (updates.subscription) {
    updateData.subscription = updates.subscription;
    console.log('💳 Updating subscription');
  }

  // Handle any other field updates
  Object.keys(updates).forEach(key => {
    if (!updateData[key] && updates[key] !== undefined) {
      updateData[key] = updates[key];
    }
  });

  const profile = await User.findOneAndUpdate(
    { auth0Id },
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-__v');

  if (!profile) {
    const error = new Error('User profile not found for patch.');
    error.statusCode = 404;
    throw error;
  }

  console.log('✅ Profile patched successfully');
  return {
    statusCode: 200,
    body: JSON.stringify(profile)
  };
}

// Main handler
export async function handler(event) {
  console.log('🚀 Function invoked:', {
    method: event.httpMethod,
    path: event.path,
    hasAuth: !!(event.headers.authorization || event.headers.Authorization)
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  try {
    let response;
    switch (event.httpMethod) {
      case 'GET': 
        response = await getProfile(event); 
        break;
      case 'POST': 
        response = await findOrCreateProfile(event); 
        break;
      case 'PUT': 
        response = await updateProfile(event); 
        break;
      case 'PATCH': 
        response = await patchProfile(event); 
        break;
      default:
        response = {
          statusCode: 405,
          body: JSON.stringify({ message: `HTTP method ${event.httpMethod} not allowed on this endpoint.` })
        };
    }
    
    return { ...response, headers: { ...CORS_HEADERS, ...response.headers } };
    
  } catch (error) {
    console.error('❌ Function error:', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    });
    
    const statusCode = error.statusCode || 500;
    return {
      statusCode,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: error.message || 'An internal server error occurred.',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      })
    };
  }
}