//assets.js/auth-callback.mjs

import { handleAuthRedirect } from './authentication.mjs';
import { checkOnboardingStatus } from './lib/onboarding.mjs';
import { handleError } from './error-handler.mjs';
  
//Handles the Auth0 callback after authentication

async function handleCallback() {
  try {
    const params = new URLSearchParams(window.location.search);
    console.debug('Auth callback parameters:', Object.fromEntries(params.entries()));
    
    // Process the authentication response
    const { access_token } = await handleAuthRedirect();
    console.debug('Access token stored in localStorage');
    
    // Check if user needs onboarding
    const { needsOnboarding, currentStep } = await checkOnboardingStatus();
    console.debug('Onboarding status:', { needsOnboarding, currentStep });
    
    // Clean the URL after processing
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Redirect to appropriate destination
    const redirectPath = needsOnboarding 
      ? `/onboarding/${currentStep}`
      : '/app/dashboard';
    
    console.debug('Redirecting to:', redirectPath);
    window.location.href = redirectPath;

  } catch (error) {
    console.error('Authentication failed:', error);
    
    // Clean the URL before error handling
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Use centralized error handler
    handleError(error, {
      type: 'auth',
      redirect: true,
      additionalInfo: {
        location: 'auth-callback',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Initialize the callback handler when DOM is ready
document.addEventListener('DOMContentLoaded', handleCallback);