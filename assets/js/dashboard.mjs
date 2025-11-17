// /assets/js/dashboard.mjs - Enhanced Dashboard functionality
import authentication from './authentication.mjs';
import apiClient from './lib/api-client.mjs';

// Payment manager - will be initialized on demand
let paymentManager = null;

// ======================
// DASHBOARD INITIALIZATION
// ======================

async function initDashboard() {
  try {
    console.log('🚀 Starting dashboard initialization...');
    
    // Check if user is authenticated
    const isAuthenticated = await authentication.checkAuthentication();
    console.log('  - Is authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      window.location.href = '/';
      return;
    }
    
    console.log('  - Getting user profile...');
    const userProfile = await authentication.getOrCreateUserProfile();
    console.log('  - User profile:', userProfile);
    
    // Update UI with user info
    updateUserDisplay(userProfile);
    updateWelcomeMessage(userProfile);
    checkProfileCompletion(userProfile);
    
    // Load dashboard data in parallel
    await Promise.all([
      loadLetters(),
      loadSubscriptionStatus()
    ]);
    
    console.log('✅ Dashboard initialization complete');
  } catch (error) {
    console.error('❌ Dashboard initialization error:', error);
    showNotification('error', 'There was an error loading your dashboard. Please try again later.');
  }
}

// ======================
// USER PROFILE FUNCTIONS
// ======================

function updateUserDisplay(userProfile) {
  const userNameDisplay = document.getElementById('user-name-display');
  if (userNameDisplay) {
    const name = userProfile.name || userProfile.email || 'User';
    userNameDisplay.textContent = name;
    console.log('✅ Updated user display:', name);
  }
}

function updateWelcomeMessage(userProfile) {
  const welcomeMessage = document.getElementById('welcome-message');
  if (welcomeMessage) {
    const firstName = userProfile.name?.split(' ')[0] || 'there';
    const timeOfDay = getTimeOfDay();
    
    welcomeMessage.innerHTML = `
      <h2>Good ${timeOfDay}, ${firstName}!</h2>
      <p>Here's your personalized letter dashboard.</p>
    `;
  }
}

function checkProfileCompletion(userData) {
  const profileIncompleteElement = document.getElementById('profile-incomplete');
  
  if (!profileIncompleteElement) return;
  
  const isProfileComplete = userData && 
                          userData.address && 
                          userData.interests && 
                          userData.interests.length > 0;
  
  if (!isProfileComplete) {
    profileIncompleteElement.classList.remove('hidden');
  } else {
    profileIncompleteElement.classList.add('hidden');
  }
}

// ======================
// LETTERS FUNCTIONS
// ======================

async function loadLetters() {
  const loadingEl = document.getElementById('letters-loading');
  const containerEl = document.getElementById('letters-container');
  const emptyEl = document.getElementById('letters-empty');
  const errorEl = document.getElementById('letters-error');
  
  if (!containerEl) {
    console.log('📬 No letters container found');
    return;
  }
  
  try {
    console.log('📬 Loading letters...');
    
    // Show loading state
    showElement(loadingEl);
    hideElement(containerEl);
    hideElement(emptyEl);
    hideElement(errorEl);
    
    const letters = await apiClient.get('letters');
    console.log('📬 Letters loaded:', letters?.length || 0);
    
    // Hide loading
    hideElement(loadingEl);
    
    if (!letters || letters.length === 0) {
      showElement(emptyEl);
      updateStats({ total: 0, unread: 0, month: 0 });
      return;
    }
    
    // Render letters
    renderLetters(letters);
    showElement(containerEl);
    
    // Update stats
    updateStats(calculateStats(letters));
    
  } catch (error) {
    console.error('❌ Error loading letters:', error);
    hideElement(loadingEl);
    hideElement(containerEl);
    hideElement(emptyEl);
    showElement(errorEl);
  }
}

function renderLetters(letters) {
  const container = document.getElementById('letters-container');
  
  if (!container) return;
  
  // Sort letters by date (newest first)
  const sortedLetters = [...letters].sort((a, b) => 
    new Date(b.sentDate) - new Date(a.sentDate)
  );
  
  // Render using template if available, otherwise use HTML string
  const template = document.getElementById('letter-card-template');
  
  if (template) {
    // Clear existing content
    container.innerHTML = '';
    
    // Use template approach
    sortedLetters.forEach(letter => {
      const card = createLetterCard(letter, template);
      container.appendChild(card);
    });
  } else {
    // Fallback to HTML string method
    container.innerHTML = sortedLetters.map(letter => `
      <div class="letter-card ${letter.isRead ? 'read' : 'unread'}" data-letter-id="${letter._id}">
        <div class="letter-header">
          <h3 class="letter-title">${escapeHtml(letter.title)}</h3>
          <span class="letter-date">${formatDate(letter.sentDate)}</span>
        </div>
        <span class="letter-topic">${escapeHtml(letter.topic || 'General')}</span>
        <p class="letter-preview">${escapeHtml(letter.preview || letter.content?.substring(0, 150) + '...')}</p>
        <div class="letter-actions">
          <a href="/app/letter?id=${letter._id}" class="btn-read">Read Letter</a>
        </div>
      </div>
    `).join('');
  }
}

function createLetterCard(letter, template) {
  const clone = template.content.cloneNode(true);
  const card = clone.querySelector('.letter-card');
  
  // Set data and classes
  card.dataset.letterId = letter._id;
  card.classList.add(letter.isRead ? 'read' : 'unread');
  
  // Populate content
  card.querySelector('.letter-title').textContent = letter.title;
  card.querySelector('.letter-date').textContent = formatDate(letter.sentDate);
  card.querySelector('.letter-topic').textContent = letter.topic || 'General';
  card.querySelector('.letter-preview').textContent = letter.preview || letter.content?.substring(0, 150) + '...';
  
  // Set link
  const readBtn = card.querySelector('.btn-read');
  readBtn.href = `/app/letter?id=${letter._id}`;
  
  return clone;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function calculateStats(letters) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return {
    total: letters.length,
    unread: letters.filter(l => !l.isRead).length,
    month: letters.filter(l => {
      const letterDate = new Date(l.sentDate);
      return letterDate.getMonth() === currentMonth && 
             letterDate.getFullYear() === currentYear;
    }).length
  };
}

function updateStats(stats) {
  const unreadEl = document.querySelector('[data-stat="unread"]');
  const totalEl = document.querySelector('[data-stat="total"]');
  const monthEl = document.querySelector('[data-stat="month"]');
  
  if (unreadEl) unreadEl.textContent = stats.unread;
  if (totalEl) totalEl.textContent = stats.total;
  if (monthEl) monthEl.textContent = stats.month;
}

// ======================
// SUBSCRIPTION FUNCTIONS
// ======================

async function loadSubscriptionStatus() {
  try {
    // Lazy load payment manager to avoid circular dependencies
    if (!paymentManager) {
      const { paymentManager: pm } = await import('./payment.mjs');
      paymentManager = pm;
    }
    
    const status = await paymentManager.getSubscriptionStatus();
    console.log('💳 Subscription status:', status);
    
    updateSubscriptionUI(status);
  } catch (error) {
    console.error('❌ Error loading subscription:', error);
    updateSubscriptionUI({ status: 'error' });
  }
}

function updateSubscriptionUI(data) {
  const badgeEl = document.querySelector('[data-subscription-badge]');
  const detailsEl = document.querySelector('[data-subscription-details]');
  const manageBtn = document.querySelector('[data-manage-subscription]');
  
  if (!badgeEl || !detailsEl) return;
  
  // Update badge
  badgeEl.className = 'subscription-status__badge';
  
  if (data.status === 'active') {
    badgeEl.classList.add('subscription-status__badge--active');
    badgeEl.textContent = 'Active';
    
    detailsEl.textContent = data.subscription?.plan 
      ? `Plan: ${data.subscription.plan}` 
      : 'Your subscription is active.';
    
    if (manageBtn) manageBtn.classList.remove('hidden');
  } else if (data.status === 'no_subscription') {
    badgeEl.classList.add('subscription-status__badge--inactive');
    badgeEl.textContent = 'Inactive';
    detailsEl.textContent = 'You don\'t have an active subscription.';
    
    if (manageBtn) manageBtn.classList.add('hidden');
  } else {
    badgeEl.classList.add('subscription-status__badge--inactive');
    badgeEl.textContent = 'Unknown';
    detailsEl.textContent = 'Unable to load subscription status.';
    
    if (manageBtn) manageBtn.classList.add('hidden');
  }
}

// ======================
// UTILITY FUNCTIONS
// ======================

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If within last 7 days, show relative time
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  // Otherwise show full date
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function showElement(element) {
  if (element) element.classList.remove('hidden');
}

function hideElement(element) {
  if (element) element.classList.add('hidden');
}

function showNotification(type, message) {
  const dashboard = document.querySelector('.dashboard__body');
  
  if (!dashboard) return;
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `<p>${message}</p>`;
  
  dashboard.insertBefore(notification, dashboard.firstChild);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// ======================
// EVENT HANDLERS
// ======================

function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authentication.logout();
    });
  }
}

// ======================
// PAGE DETECTION & INITIALIZATION
// ======================

document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 Dashboard.mjs loaded');
  
  setupEventListeners();
  
  // Check if we're on the main dashboard page
  const lettersContainer = document.getElementById('letters-container');
  const welcomeMessage = document.getElementById('welcome-message');
  
  if (lettersContainer || welcomeMessage) {
    console.log('📊 Dashboard page detected, initializing...');
    initDashboard();
  } else {
    console.log('📄 Not dashboard page, running basic auth check...');
    // Basic auth check for other dashboard pages (topics, account)
    authentication.checkAuthentication()
      .then(isAuthenticated => {
        if (!isAuthenticated) {
          console.log('❌ Not authenticated, redirecting...');
          window.location.href = '/';
          return;
        }
        return authentication.getOrCreateUserProfile();
      })
      .then(userProfile => {
        if (userProfile) {
          updateUserDisplay(userProfile);
        }
      })
      .catch(error => {
        console.error('❌ Auth check failed:', error);
      });
  }
});