// /assets/js/lib/config.mjs Configuration settings for different environments
const config = {
  auth0: {
    domain: "dev-rfi7yfcndb5e8ycp.us.auth0.com",
    clientId: "yFAETJSMSqlxpzKzYmvBgKOSF7657c9z",
    audience: "https://lumoletters.com",
    redirectUri: window.location.origin + '/callback',
    logoutRedirectUri: window.location.origin,
    scope: 'openid profile email read:current_user update:current_user_metadata'
  },
  api: {
    baseUrl: window.location.hostname === 'localhost' 
      ? '/.netlify/functions'
      : '/.netlify/functions'
  },
  onboarding: {
    steps: ['welcome', 'address', 'interests', 'complete'],
    redirectPath: '/onboarding'
  },
  // Add Stripe configuration
  stripe: {
    publicKey: window.location.hostname === 'localhost' 
      ? 'pk_test_...'  // Replace with your test key
      : 'pk_live_...'  // Replace with your live key
  }
};

export default config;