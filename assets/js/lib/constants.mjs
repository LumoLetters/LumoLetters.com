// /Assets/js/lib/constants.mjs Application constants

export const AUTH = {
  TOKEN_KEY: 'auth_token',
  ID_TOKEN_KEY: 'id_token',
  STATE_KEY: 'auth_state',
  CODE_VERIFIER: 'code_verifier',
  IS_AUTHENTICATED: 'is_authenticated', // Add this line
};

export const EVENTS = {
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_ERROR: 'auth:error',
  PROFILE_UPDATED: 'profile:updated',
  PROFILE_ERROR: 'profile:error'
};

export const ENDPOINTS = {
  AUTH: 'auth-user',
  LETTERS: 'letters',
  SUBSCRIPTION: 'subscription'
};

