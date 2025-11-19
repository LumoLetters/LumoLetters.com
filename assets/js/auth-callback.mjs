//assets/js/auth-callback.mjs

import { handleAuthRedirect, getOrCreateUserProfile } from './authentication.mjs';
import { checkOnboardingStatus } from './lib/onboarding.mjs';
import { setItem } from './lib/storage.mjs';
import { AUTH } from './lib/constants.mjs';
import { handleError } from './error-handler.mjs';
  
//Handles the Auth0 callback after authentication

async function handleCallback() {
  try {
    console.debug('🔄 Starting auth callback handler...');
    const params = new URLSearchParams(window.location.search);
    console.debug('📝 Auth callback parameters:', Object.fromEntries(params.entries()));
    
    // Process the authentication response
    const { access_token, id_token } = await handleAuthRedirect();
    console.debug('✅ Tokens received and stored');
    
    // Mark user as authenticated
    setItem(AUTH.IS_AUTHENTICATED, 'true');
    console.debug('✅ Authentication state saved');
    
    // Create or get user profile from backend
    console.debug('👤 Creating/fetching user profile...');
    const userProfile = await getOrCreateUserProfile();
    console.debug('✅ User profile:', userProfile);
    
    // Check if user needs onboarding
    console.debug('🔍 Checking onboarding status...');
    const { needsOnboarding, currentStep } = await checkOnboardingStatus();
    console.debug('📊 Onboarding status:', { needsOnboarding, currentStep });
    
    // Clean the URL after processing
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Determine redirect destination
    let redirectPath;
    if (needsOnboarding) {
      // New user or incomplete onboarding - send to onboarding
      redirectPath = `/onboarding/${currentStep}`;
      console.debug('🆕 New user - redirecting to onboarding:', currentStep);
    } else {
      // Existing user who completed onboarding - send to dashboard
      redirectPath = '/app/dashboard';
      console.debug('✅ Returning user - redirecting to dashboard');
    }
    
    console.debug('🎯 Final redirect to:', redirectPath);
    window.location.href = redirectPath;

  } catch (error) {
    console.error('❌ Authentication callback failed:', error);
    
    // Clean the URL before error handling
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Use centralized error handler
    handleError(error, {
      type: 'auth',
      redirect: true,
      message: 'Authentication failed. Please try logging in again.',
      additionalInfo: {
        location: 'auth-callback',
        timestamp: new Date().toISOString(),
        error: error.message
      }
    });
    
    // Redirect to home page after a brief delay
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
  }
}

// Initialize the callback handler when DOM is ready
document.addEventListener('DOMContentLoaded', handleCallback);

// Export the function so it can be imported if needed
export { handleCallback };