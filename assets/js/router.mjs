//assets/js/router.mjs

import { checkOnboardingStatus } from './lib/onboarding.mjs';

export async function protectRoutes() {
  const { needsOnboarding, currentStep } = await checkOnboardingStatus();
  
  if (needsOnboarding && !window.location.pathname.startsWith('/onboarding')) {
    window.location.href = `/onboarding/${currentStep}`;
    return false;
  }
  
  if (!needsOnboarding && window.location.pathname.startsWith('/onboarding')) {
    window.location.href = '/dashboard';
    return false;
  }
  
  return true;
}

// Usage in main app:
document.addEventListener('DOMContentLoaded', async () => {
  if (await protectRoutes()) {
    // Load normal page content
  }
});