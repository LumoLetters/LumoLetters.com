// netlify/functions/lib/auth-utils.mjs
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Initialize client lazily to ensure env vars are available
let client = null;

function getJwksClient() {
  if (client) return client;
  
  const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
  if (!AUTH0_DOMAIN) {
    throw new Error('AUTH0_DOMAIN environment variable is required');
  }
  
  const jwksUri = `https://${AUTH0_DOMAIN}/.well-known/jwks.json`;
  console.log('Initializing JWKS client with URI:', jwksUri);
  
  client = jwksClient({
    jwksUri,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 10 * 60 * 1000,
  });
  
  return client;
}

function getKey(header, callback) {
  try {
    const jwksClientInstance = getJwksClient();
    jwksClientInstance.getSigningKey(header.kid, (err, key) => {
      if (err) {
        console.error('Error getting signing key:', err);
        return callback(err);
      }
      const signingKey = key.getPublicKey ? key.getPublicKey() : key.rsaPublicKey;
      callback(null, signingKey);
    });
  } catch (error) {
    console.error('Error initializing JWKS client:', error);
    callback(error);
  }
}

export async function verifyTokenAndGetSub(event) {
  // Extract token from Authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Missing or invalid Authorization header. Expected: Bearer <token>');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    const error = new Error('No token found in Authorization header after Bearer.');
    error.statusCode = 401;
    throw error;
  }

  // Get Auth0 configuration from environment variables
  const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
  const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

  if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
    console.error('Missing Auth0 configuration:', { 
      hasDomain: !!AUTH0_DOMAIN, 
      hasAudience: !!AUTH0_AUDIENCE 
    });
    const error = new Error('Server configuration error: Missing Auth0 settings');
    error.statusCode = 500;
    throw error;
  }

  const issuer = `https://${AUTH0_DOMAIN}/`;
  
  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        audience: AUTH0_AUDIENCE,
        issuer: issuer,
        algorithms: ['RS256']
      }, (err, decodedPayload) => {
        if (err) {
          console.error(`JWT verification failed:`, {
            name: err.name,
            message: err.message,
            audience: AUTH0_AUDIENCE,
            issuer: issuer
          });
          const authError = new Error(`Token verification failed: ${err.message}`);
          authError.statusCode = 401;
          return reject(authError);
        }
        resolve(decodedPayload);
      });
    });

    if (!decoded.sub) {
      const error = new Error('Token is valid but missing "sub" (user ID) claim.');
      error.statusCode = 401; 
      throw error;
    }
    
    console.log('Token verified successfully for user:', decoded.sub);
    return decoded.sub;
    
  } catch (error) {
    if (error.statusCode) throw error;
    
    console.error('Unexpected error during token verification:', error);
    const genericError = new Error('Token verification failed');
    genericError.statusCode = 500;
    throw genericError;
  }
}