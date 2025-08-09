// assets/js/app-init.mjs

import { checkAuthentication } from './authentication.mjs';
import { EVENTS } from './lib/constants.mjs';
import eventBus from './lib/event-bus.mjs';
import * as ui from './lib/ui-handler.mjs';

export async function initApp() {
  try {
    if (window.location.pathname === '/callback') {
      console.debug('Handling Auth0 login redirect...');
      const { handleAuthRedirect } = await import('./authentication.mjs');
      await handleAuthRedirect();

      // Optionally: update UI here if callback page shows anything
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
    ui.showErrorMessage('Failed to initialize application');
  }
}

// Global auth error listener
eventBus.on(EVENTS.AUTH_ERROR, (data) => {
  console.error('Auth error event:', data);
  ui.showErrorMessage(data.message || 'Authentication error');
});

