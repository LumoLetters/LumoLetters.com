// /Assets/js/dashboard.mjs Dashboard functionality
import { getUserProfile } from './authentication.mjs';
import * as api from './lib/api-client.mjs';
import { ENDPOINTS } from './lib/constants.mjs';

/**
 * Initialize the dashboard page
 */
async function initDashboard() {
  try {
    // Check if user is authenticated
    const userProfile = await getUserProfile();
    
    if (!userProfile) {
      // Redirect to home if not authenticated
      window.location.href = '/';
      return;
    }
    
    // Update welcome message
    updateWelcomeMessage(userProfile);
    
    // Get user data from our database
    const userData = await getUserData();
    
    // Check if profile is complete
    checkProfileCompletion(userData);
    
    // Load user's letters
    await loadLetters();
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    displayError('There was an error loading your dashboard. Please try again later.');
  }
}

/**
 * Update the welcome message with the user's name
 * @param {Object} userProfile - The user's Auth0 profile
 */
function updateWelcomeMessage(userProfile) {
  const welcomeMessage = document.getElementById('welcome-message');
  if (welcomeMessage) {
    const name = userProfile.name || userProfile.nickname || 'there';
    welcomeMessage.innerHTML = `
      <h2>Welcome, ${name}!</h2>
      <p>Here's your LumoLetters dashboard where you can manage your letters and preferences.</p>
    `;
  }
}

/**
 * Get user data from our database
 * @returns {Promise<Object>} - User data
 */
async function getUserData() {
  try {
    const userData = await api.get(ENDPOINTS.AUTH);
    return userData;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

/**
 * Check if the user's profile is complete
 * @param {Object} userData - User data from our database
 */
function checkProfileCompletion(userData) {
  const profileIncompleteElement = document.getElementById('profile-incomplete');
  
  // Check if profile is complete (this logic will depend on your requirements)
  const isProfileComplete = userData && 
                          userData.address && 
                          userData.interests && 
                          userData.interests.length > 0;
  
  if (!isProfileComplete && profileIncompleteElement) {
    profileIncompleteElement.style.display = 'block';
  }
}

/**
 * Load the user's letters
 */
async function loadLetters() {
  try {
    const lettersContainer = document.getElementById('letters-container');
    
    const letters = await api.get(ENDPOINTS.LETTERS);
    
    if (!letters || letters.length === 0) {
      // No letters yet
      if (lettersContainer) {
        lettersContainer.innerHTML = `
          <div class="empty-state">
            <h3>No Letters Yet</h3>
            <p>Your first letter will arrive soon. Check back later!</p>
          </div>
        `;
      }
      return;
    }
    
    // Display letters
    if (lettersContainer) {
      lettersContainer.innerHTML = letters.map(letter => `
        <div class="letter-card ${letter.isRead ? 'read' : 'unread'}">
          <div class="letter-header">
            <h3>${letter.title}</h3>
            <span class="letter-date">${formatDate(letter.sentDate)}</span>
          </div>
          <p class="letter-preview">${letter.preview}</p>
          <a href="/app/letter.html?id=${letter._id}" class="btn btn-outline">Read Letter</a>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading letters:', error);
    const lettersContainer = document.getElementById('letters-container');
    if (lettersContainer) {
      lettersContainer.innerHTML = `
        <div class="error-message">
          <p>Unable to load your letters. Please try again later.</p>
        </div>
      `;
    }
  }
}

/**
 * Format a date string
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Display an error message
 * @param {string} message - Error message to display
 */
function displayError(message) {
  const dashboard = document.querySelector('.dashboard-content');
  
  if (dashboard) {
    const errorElement = document.createElement('div');
    errorElement.className = 'notification error';
    errorElement.innerHTML = `<p>${message}</p>`;
    
    // Add to the beginning of the dashboard
    dashboard.prepend(errorElement);
    
    // Remove after 5 seconds
    setTimeout(() => {
      errorElement.remove();
    }, 5000);
  }
}

if (userProfile && !userProfile.profileComplete) {
  window.location.href = '/onboarding/' + (userProfile.profileStep || 'welcome');
}


// Initialize the dashboard when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initDashboard);