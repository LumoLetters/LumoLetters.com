//assets/js/error-handler.mjs

// Centralized error handling for the application


import eventBus from './lib/event-bus.mjs';
import { EVENTS } from './lib/constants.mjs';

// Default error messages for different error types
const ERROR_MESSAGES = {
  auth: {
    default: 'Authentication failed. Please try logging in again.',
    invalid_state: 'Invalid authentication state. Please try again.',
    token_failure: 'Session validation failed. Please log in again.',
    network: 'Network error occurred. Please check your connection.'
  },
  api: {
    default: 'API request failed.',
    timeout: 'Request timed out.',
    validation: 'Invalid data received.'
  }
};

/**
 * Handles errors and redirects to error page
 * @param {Error|string} error - The error object or message
 * @param {object} options - Additional options
 * @param {string} options.type - Error type (auth|api)
 * @param {boolean} options.redirect - Whether to redirect to error page
 */
export function handleError(error, options = {}) {
  const { type = 'default', redirect = true } = options;
  let errorMessage = typeof error === 'string' ? error : error.message;
  
  // Get friendly message if available
  if (!errorMessage && ERROR_MESSAGES[type]) {
    errorMessage = ERROR_MESSAGES[type].default;
  }

  // Emit event for other components to handle
  eventBus.emit(EVENTS.AUTH_ERROR, { 
    message: errorMessage,
    type,
    originalError: error
  });

  // Log to console for debugging
  console.error(`[${type} error]`, error);

  // Redirect to error page if needed
  if (redirect && window.location.pathname !== '/error') {
    window.location.href = `/error?message=${encodeURIComponent(errorMessage)}`;
  }

  return errorMessage;
}

/**
 * Initializes global error handlers
 */
export function initErrorHandling() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    handleError(event.error, { redirect: true });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, { redirect: true });
  });

  // Listen for auth errors from event bus
  eventBus.on(EVENTS.AUTH_ERROR, (error) => {
    handleError(error, { redirect: true, type: 'auth' });
  });
}

// Initialize automatically when imported
initErrorHandling();

/**
 * Displays error message in UI (alternative to redirect)
 * @param {string} message - Error message to display
 */
export function showInlineError(message) {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
  }
}

function displayErrorPageMessage() {
  if (window.location.pathname === '/error') {
    const params = new URLSearchParams(window.location.search);
    const errorMessage = params.get('message');

    const el = document.getElementById('error-message');
    if (el) {
      el.textContent = errorMessage
        ? decodeURIComponent(errorMessage)
        : 'An unknown error occurred.';
    }
  }
}

displayErrorPageMessage();