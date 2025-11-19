// /assets/js/authentication.mjs

import { getItem, setItem, removeItem, clearAll } from './lib/storage.mjs';
import { post } from './lib/api-client.mjs';
import { AUTH, EVENTS } from './lib/constants.mjs';
import eventBus from './lib/event-bus.mjs';
import config from './lib/config.mjs';
import { handleError } from './error-handler.mjs'; 

// ---------------------------
// Auth: Utility Helpers
// ---------------------------

function generateRandomString(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    handleError(error, { type: 'auth', redirect: false });
    return null;
  }
}

// ---------------------------
// Auth: Core Functions
// ---------------------------

export async function login() {
  try {
    const verifier = generateRandomString();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateRandomString();

    setItem(AUTH.CODE_VERIFIER, verifier);
    setItem(AUTH.STATE_KEY, state);

    const authUrl = new URL(`https://${config.auth0.domain}/authorize`);
    const params = {
      response_type: 'code',
      client_id: config.auth0.clientId,
      redirect_uri: config.auth0.redirectUri,
      scope: config.auth0.scope,
      audience: config.auth0.audience,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      response_mode: 'query'
    };

    Object.entries(params).forEach(([key, value]) => {
      authUrl.searchParams.append(key, value);
    });

    console.debug('Initiating Auth0 login flow');
    window.location.href = authUrl.toString();
  } catch (error) {
    handleError(error, { 
      type: 'auth',
      redirect: false,
      message: 'Failed to initialize login process'
    });
    throw error;
  }
}

export async function handleAuthRedirect() {
  try {
    const params = new URLSearchParams(window.location.search);
    console.debug('URL params:', params.toString());

    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    console.debug('code:', code, 'state:', state, 'error:', error);

    if (error) {
      const errorDesc = params.get('error_description') || 'Authentication failed';
      console.error('Auth error:', errorDesc);
      throw new Error(errorDesc);
    }

    if (!code || !state) {
      throw new Error('Missing authentication parameters');
    }

    const savedState = getItem(AUTH.STATE_KEY);
    console.debug('Saved state from storage:', savedState);
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    const verifier = getItem(AUTH.CODE_VERIFIER);
    console.debug('Code verifier from storage:', verifier);
    if (!verifier) {
      throw new Error('Missing code verifier');
    }

    console.debug('Exchanging auth code for tokens...');
    const response = await fetch(`https://${config.auth0.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: config.auth0.clientId,
        code_verifier: verifier,
        code,
        redirect_uri: config.auth0.redirectUri
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token exchange error response:', errorData);
      throw new Error(errorData.error_description || 'Token exchange failed');
    }

    const { access_token, id_token } = await response.json();
    console.debug('Tokens received successfully');

    // Store tokens
    setItem(AUTH.TOKEN_KEY, access_token);
    setItem(AUTH.ID_TOKEN_KEY, id_token);
    setItem(AUTH.IS_AUTHENTICATED, 'true'); 

    // Clean up temporary storage
    removeItem(AUTH.STATE_KEY);
    removeItem(AUTH.CODE_VERIFIER);

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

    console.debug('Authentication flow completed successfully');
    
    // Emit auth success event
    eventBus.emit(EVENTS.AUTH_SUCCESS, { access_token, id_token });
    
    return { access_token, id_token };
  } catch (error) {
    console.error('Authentication redirect failed:', error);
    
    // Emit auth error event
    eventBus.emit(EVENTS.AUTH_ERROR, { 
      message: error.message,
      error 
    });
    
    handleError(error, { type: 'auth', redirect: false });
    throw error;
  }
}

// KEEP THIS ONE - checks both IS_AUTHENTICATED flag and token
export async function checkAuthentication() {
  try {
    const isAuthenticated = getItem(AUTH.IS_AUTHENTICATED) === 'true';
    const token = getToken();
    const authenticated = isAuthenticated && !!token;
    
    console.debug('Authentication check:', authenticated);
    
    if (!authenticated) {
      throw new Error('User is not authenticated');
    }
    
    return authenticated;
  } catch (error) {
    console.debug('Authentication check failed:', error.message);
    return false;
  }
}

export function logout() {
  try {
    clearAll();
    eventBus.emit(EVENTS.AUTH_LOGOUT);

    const logoutUrl = new URL(`https://${config.auth0.domain}/v2/logout`);
    logoutUrl.searchParams.append('client_id', config.auth0.clientId);
    logoutUrl.searchParams.append('returnTo', config.auth0.logoutRedirectUri);

    console.debug('Initiating logout flow');
    window.location.href = logoutUrl.toString();
  } catch (error) {
    handleError(error, {
      type: 'auth',
      redirect: false,
      message: 'Failed to complete logout'
    });
  }
}

export function getToken() {
  return getItem(AUTH.TOKEN_KEY);
}

// REMOVED THE DUPLICATE checkAuthentication FUNCTION THAT WAS HERE

export async function getOrCreateUserProfile() {
  try {
    const token = getToken();
    if (!token) throw new Error('No access token available');

    const idToken = getItem(AUTH.ID_TOKEN_KEY);
    console.debug('🆔 ID Token:', idToken ? 'exists' : 'missing');
    
    const userInfo = parseJwt(idToken);
    console.debug('👤 Parsed user info:', userInfo);
    console.debug('📧 Email from token:', userInfo?.email);

    if (!userInfo?.email) {
      // Fallback: try to get email from access token
      console.warn('⚠️ No email in ID token, trying access token...');
      const accessTokenInfo = parseJwt(token);
      console.debug('🔑 Access token info:', accessTokenInfo);
      
      if (!accessTokenInfo?.email) {
        throw new Error('User information not available in token');
      }
      
      userInfo.email = accessTokenInfo.email;
    }

    console.debug('Fetching or creating user profile for:', userInfo.email);
    
    const response = await post('auth-user', {
      email: userInfo.email,
      name: userInfo.name || userInfo.email.split('@')[0]
    });

    console.debug('Profile response:', response);
    return response.user || response;
  } catch (error) {
    console.error('Profile handling failed:', error);
    eventBus.emit(EVENTS.AUTH_ERROR, { 
      message: error.message,
      error 
    });
    handleError(error, { 
      type: 'auth',
      redirect: false
    });
    throw error;
  }
}

export function updateAuthUI(isAuthenticated) {
  try {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const dashboardLink = document.getElementById('dashboard-link');

    if (isAuthenticated) {
      if (loginButton) loginButton.style.display = 'none';
      if (logoutButton) logoutButton.style.display = 'inline-block';
      if (dashboardLink) dashboardLink.style.display = 'inline-block';
    } else {
      if (loginButton) loginButton.style.display = 'inline-block';
      if (logoutButton) logoutButton.style.display = 'none';
      if (dashboardLink) dashboardLink.style.display = 'none';
    }
  } catch (error) {
    handleError(error, {
      type: 'ui',
      redirect: false,
      message: 'Failed to update authentication UI'
    });
  }
}

const authentication = {
  login,
  logout,
  checkAuthentication,
  getOrCreateUserProfile,
  updateAuthUI,
  getToken,
  handleAuthRedirect
};

export default authentication;