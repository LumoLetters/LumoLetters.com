// assets/js/cta-handler.mjs
// Centralized handler for all "Get Started" / "Sign Up" CTAs

import { checkAuthentication, login } from './authentication.mjs';

export async function handleGetStartedClick(e) {
  if (e) e.preventDefault();

  try {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem('lumoletters_isAuthenticated') === 'true';
    
    if (isAuthenticated) {
      // Already logged in - check if they need onboarding
      const { checkOnboardingStatus } = await import('./lib/onboarding.mjs');
      
      try {
        const { needsOnboarding, currentStep } = await checkOnboardingStatus();
        
        if (needsOnboarding) {
          // Continue onboarding from where they left off
          window.location.href = `/onboarding/${currentStep}`;
        } else {
          // Already completed onboarding - go to dashboard
          window.location.href = '/app/dashboard';
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error, just send to dashboard
        window.location.href = '/app/dashboard';
      }
    } else {
      // Not logged in - trigger Auth0 login/signup
      // Auth0 will redirect to /onboarding/welcome after successful auth
      login();
    }
  } catch (error) {
    console.error('Error handling CTA click:', error);
    // Fallback: just trigger login
    login();
  }
}

// Auto-attach to all CTA buttons on page load
document.addEventListener('DOMContentLoaded', () => {
  const ctaSelectors = [
    '.trigger-signup',
    '[data-cta="get-started"]',
    '#get-started-button',
    '#how-it-works-cta',
    '#final-cta-button',
    '.pricing-card__cta',
    '#pricing-cta'
  ];

  ctaSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(button => {
      button.addEventListener('click', handleGetStartedClick);
    });
  });
});