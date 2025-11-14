// /assets/js/lib/ui-handler.mjs

import * as auth from '../authentication.mjs';
import { EVENTS } from './constants.mjs';
import eventBus from './event-bus.mjs';

export function initUIListeners() {
  console.log('Initializing UI listeners...');
  initAuthButtons();
  
  eventBus.on(EVENTS.AUTH_LOGIN, (data) => {
    console.log('AUTH_LOGIN event:', data);
    updateAuthUI(data.isAuthenticated); 
  });
  
  eventBus.on(EVENTS.AUTH_LOGOUT, () => {
    console.log('AUTH_LOGOUT event');
    updateAuthUI(false);
  });
  
  eventBus.on(EVENTS.AUTH_ERROR, (error) => {
    console.log('AUTH_ERROR event:', error);
    showErrorMessage(error.message);
  });
}

function initAuthButtons() {
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const getStartedButton = document.getElementById('get-started-button');
  
  console.log('Binding buttons:', { 
    loginButton: !!loginButton, 
    logoutButton: !!logoutButton, 
    getStartedButton: !!getStartedButton 
  });
  
  if (loginButton) {
    loginButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Login button clicked');
      auth.login();
    });
  }
  
  if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Logout button clicked');
      auth.logout();
    });
  }
  
  if (getStartedButton) {
    auth.checkAuthentication().then(isAuthenticated => {
      getStartedButton.textContent = isAuthenticated ? 'Go to Dashboard' : "Let's Begin";
      getStartedButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Get Started button clicked');
        if (isAuthenticated) {
          window.location.href = '/app/dashboard/';
        } else {
          auth.login();
        }
      });
    });
  }
}

function updateAuthUI(isAuthenticated) {
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const dashboardLink = document.getElementById('dashboard-link');
  
  console.log('Updating auth UI:', isAuthenticated);
  
  if (isAuthenticated) {
    if (loginButton) loginButton.style.display = 'none';
    if (logoutButton) logoutButton.style.display = 'inline-block';
    if (dashboardLink) dashboardLink.style.display = 'inline-block';
  } else {
    if (loginButton) loginButton.style.display = 'inline-block';
    if (logoutButton) logoutButton.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'none';
  }
}

function showErrorMessage(message) {
  console.error('Auth Error:', message);
  
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  } else {
    // Fallback: just log to console if no error container exists
    console.warn('No error-container element found, error not displayed to user');
    // Could also use alert() as last resort:
    // alert(message);
  }
}

export { showErrorMessage, updateAuthUI };