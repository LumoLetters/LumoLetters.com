// /assets/js/dashboard.mjs - Dashboard functionality
import authentication from './authentication.mjs';
import apiClient from './lib/api-client.mjs';

// Initialize the dashboard page
async function initDashboard() {
  try {
    console.log('🚀 Starting dashboard initialization...');
    
    // Check if user is authenticated
    const isAuthenticated = await authentication.checkAuthentication();
    console.log('  - Is authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      // Redirect to home if not authenticated
      window.location.href = '/';
      return;
    }
    
    console.log('  - Getting user profile...');
    // Get user profile
    const userProfile = await authentication.getOrCreateUserProfile();
    console.log('  - User profile:', userProfile);
    
    // Update user name display in header
    updateUserDisplay(userProfile);
    
    // Update welcome message
    updateWelcomeMessage(userProfile);
    
    // Check if profile is complete
    checkProfileCompletion(userProfile);
    
    console.log('  - Loading letters...');
    // Load user's letters
    await loadLetters();
  } catch (error) {
    console.error('❌ Dashboard initialization error:', error);
    displayError('There was an error loading your dashboard. Please try again later.');
  }
}

/**
 * Update the user display in the header
 * @param {Object} userProfile - The user's profile
 */
function updateUserDisplay(userProfile) {
  const userNameDisplay = document.getElementById('user-name-display');
  if (userNameDisplay) {
    const name = userProfile.name || userProfile.email || 'User';
    userNameDisplay.textContent = name;
    console.log('✅ Updated user display:', name);
  } else {
    console.warn('⚠️ user-name-display element not found (this is OK if not on dashboard)');
  }
}

/**
 * Update the welcome message with the user's name
 * @param {Object} userProfile - The user's profile
 */
function updateWelcomeMessage(userProfile) {
  const welcomeMessage = document.getElementById('welcome-message');
  if (welcomeMessage) {
    const name = userProfile.name || userProfile.email || 'there';
    welcomeMessage.innerHTML = `
      <h2>Welcome, ${name}!</h2>
      <p>Here's your LumoLetters dashboard where you can manage your letters and preferences.</p>
    `;
  }
}

/**
 * Check if the user's profile is complete
 * @param {Object} userData - User data from our database
 */
function checkProfileCompletion(userData) {
  const profileIncompleteElement = document.getElementById('profile-incomplete');
  
  // Check if profile is complete
  const isProfileComplete = userData && 
                          userData.address && 
                          userData.interests && 
                          userData.interests.length > 0;
  
  if (!isProfileComplete && profileIncompleteElement) {
    profileIncompleteElement.style.display = 'block';
  }
}

// Load the user's letters
async function loadLetters() {
  try {
    console.log('📬 Attempting to load letters...');
    
    const lettersContainer = document.getElementById('letters-container');
    
    if (!lettersContainer) {
      console.log('📬 No letters container found, skipping letter load');
      return;
    }
    
    const letters = await apiClient.get('letters');
    console.log('📬 Letters response:', letters);
    console.log('📬 Letters count:', letters?.length);
    
    if (!letters || letters.length === 0) {
      console.log('📬 No letters found');
      lettersContainer.innerHTML = `
        <div class="empty-state">
          <h3>No Letters Yet</h3>
          <p>Your first letter will arrive soon. Check back later!</p>
        </div>
      `;
      return;
    }
    
    console.log('📬 Rendering', letters.length, 'letters');
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
    
    dashboard.prepend(errorElement);
    
    setTimeout(() => {
      errorElement.remove();
    }, 5000);
  }
}

// Handle logout and initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 Dashboard.mjs DOMContentLoaded fired');
  console.log('📄 Current URL:', window.location.pathname);
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authentication.logout();
    });
  }
  
  // Check for dashboard-specific elements
  const lettersContainer = document.getElementById('letters-container');
  const welcomeMessage = document.getElementById('welcome-message');
  
  console.log('📄 Letters container exists:', !!lettersContainer);
  console.log('📄 Welcome message exists:', !!welcomeMessage);
  
  if (lettersContainer || welcomeMessage) {
    console.log('📊 Dashboard page detected, initializing full dashboard...');
    initDashboard();
  } else {
    console.log('📄 Not dashboard page, running basic auth check...');
    // Basic auth check for non-dashboard pages
    authentication.checkAuthentication()
      .then(isAuthenticated => {
        if (!isAuthenticated) {
          console.log('❌ Not authenticated, redirecting...');
          window.location.href = '/';
          return;
        }
        console.log('✅ Authenticated, loading user profile...');
        return authentication.getOrCreateUserProfile();
      })
      .then(userProfile => {
        if (userProfile) {
          console.log('✅ Got user profile, updating display...');
          updateUserDisplay(userProfile);
        }
      })
      .catch(error => {
        console.error('❌ Auth check failed:', error);
      });
  }
});