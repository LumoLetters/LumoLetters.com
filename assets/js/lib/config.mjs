// /assets/js/lib/config.mjs Configuration settings for different environments

const config = {
  auth0: {
    domain: "dev-rfi7yfcndb5e8ycp.us.auth0.com",
    clientId: "g4CJUvtN3ifDyuS7S4HYp8woUpJ3h16l",
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
  // Stripe configuration
  stripe: {
    publicKey: window.location.hostname === 'localhost' 
      ? 'pk_test_51QgeAID17fmHGu2vnlPu1fh4dV86RsCpmKQRnrs5M5vebj4XtHjdivzv15ZkQw96cuEX7W6bln5aZ2e9TsfTxN9g00E8iVGW7e' 
      : 'pk_live_51QgeAID17fmHGu2vJaC4cHmHCp30QfFvJrMXnlAB0k17S2TntmoBgcZxWVmZKO4S22uHP8EYNd108dV34jvIySQa0005uLKXut'
  }
};

export default config;