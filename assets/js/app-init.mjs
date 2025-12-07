// assets/js/app-init.mjs

import { checkAuthentication } from './authentication.mjs';
import { EVENTS } from './lib/constants.mjs';
import eventBus from './lib/event-bus.mjs';
import * as ui from './lib/ui-handler.mjs';
// REMOVED: import './dashboard.mjs'; ← This was causing dashboard to load on all pages

export async function initApp() {
  try {
    // Skip app initialization on onboarding pages - they have their own handlers
    if (window.location.pathname.startsWith('/onboarding/')) {
      console.log('Onboarding page detected - skipping app initialization');
      return;
    }

    if (window.location.pathname === '/callback') {
      console.debug('Handling Auth0 login redirect...');
      const { handleAuthRedirect } = await import('./authentication.mjs');
      await handleAuthRedirect();
      return;
    }

    console.log('Initializing app...');
    ui.initUIListeners();

    const isAuthenticated = await checkAuthentication();
    console.log('Auth state:', isAuthenticated);

    ui.updateAuthUI(isAuthenticated);
    eventBus.emit(EVENTS.AUTH_LOGIN, { isAuthenticated });

    const isProtectedPage = ['/app/dashboard.html', '/app/account.html', '/app/topics.html'].includes(window.location.pathname);
    if (isProtectedPage && !isAuthenticated) {
      window.location.href = '/';
    }

  } catch (error) {
    console.error('App initialization error:', error);
    // Only show error UI if error container exists (not on dashboard pages)
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      ui.showErrorMessage('Failed to initialize application');
    }
  }
}

// Global auth error listener
eventBus.on(EVENTS.AUTH_ERROR, (data) => {
  console.error('Auth error event:', data);
  // Only show error UI if error container exists
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    ui.showErrorMessage(data.message || 'Authentication error');
  }
});

// CRITICAL: Actually call initApp when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('📌 DOM ready — initializing app...');
  initApp();
});