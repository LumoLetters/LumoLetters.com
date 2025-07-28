// /assets/js/app.mjs 
// Onboarding Check

import { checkOnboardingStatus } from './lib/onboarding.mjs';
import { checkAuth } from './authentication.mjs';

async function initApp() {
  try {
    await checkAuth(); // Your existing auth check
    
    // New onboarding check
    const { needsOnboarding, currentStep } = await checkOnboardingStatus();
    
    if (needsOnboarding && !window.location.pathname.startsWith('/onboarding')) {
      window.location.href = `/onboarding/${currentStep}`;
      return;
    }
    
    // Existing app init
    console.log('App initialized');
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', initApp);