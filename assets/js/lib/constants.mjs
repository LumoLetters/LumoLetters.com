// /Assets/js/lib/constants.mjs Application constants

export const AUTH = {
  STORAGE_KEY: 'lumo_auth',
  TOKEN_KEY: 'lumo_token',
  ID_TOKEN_KEY: 'lumo_id_token',
  CODE_VERIFIER: 'lumo_code_verifier',
  STATE_KEY: 'lumo_state'
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

