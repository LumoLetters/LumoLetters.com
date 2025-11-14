// /assets/js/account.mjs
import apiClient from './lib/api-client.mjs';

class AccountPage {
  constructor() {
    this.loadingState = document.getElementById('loading-state');
    this.errorState = document.getElementById('error-state');
    this.mainContent = document.getElementById('main-content');
    this.init();
  }

async init() {
  try {
    console.log('🚀 Initializing account page...');
    
    // Check authentication
    const token = localStorage.getItem('lumoletters_lumo_token');
    console.log('🔑 Token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found, redirecting to home...');
      window.location.href = '/';
      return;
    }
    
    // Verify critical elements exist
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      console.error('❌ Main content container not found!');
      console.log('Available elements:', document.body.innerHTML.substring(0, 500));
      return;
    }
    
    await this.loadAccountData();
    this.setupEventListeners();
  } catch (error) {
    console.error('❌ Init error:', error);
    this.showError('Failed to load account information', error.message);
  }
}

async loadAccountData() {
  try {
    console.log('🔧 Loading account data...');
    
    // Use the existing authentication function that already handles this
    const authentication = await import('./authentication.mjs');
    const userData = await authentication.default.getOrCreateUserProfile();
    console.log('✅ User data received:', userData);
    
    // Load subscription status
    console.log('📡 Calling subscription/status endpoint...');
    const subResponse = await apiClient.get('subscription/status');
    console.log('✅ Subscription data received:', subResponse);
    
    this.displayUserData(userData);
    this.displaySubscriptionData(subResponse);
    
    this.hideLoading();
    this.showMainContent();
    
  } catch (error) {
    console.error('❌ Error loading account data:', error);
    throw error;
  }
}
displayUserData(user) {
  console.log('📝 Displaying user data:', user);
  
  // Debug: Log what elements exist
  console.log('🔍 Checking for elements...');
  console.log('  - main-content:', !!document.getElementById('main-content'));
  console.log('  - user-name:', !!document.getElementById('user-name'));
  console.log('  - user-email:', !!document.getElementById('user-email'));
  console.log('  - loading-state:', !!document.getElementById('loading-state'));
  
  // Name
  const nameEl = document.getElementById('user-name');
  if (nameEl) {
    nameEl.textContent = user.name || 'Not provided';
  } else {
    console.error('❌ user-name element not found');
  }
    
    // Email
    const emailEl = document.getElementById('user-email');
    if (emailEl) {
      emailEl.textContent = user.email || 'Not provided';
    } else {
      console.error('❌ user-email element not found');
    }
    
    // Display address
    const addressDisplay = document.getElementById('address-display');
    const noAddress = document.getElementById('no-address');
    
    if (user.address && user.address.street) {
      const streetEl = document.getElementById('address-street');
      const cityEl = document.getElementById('address-city');
      const stateEl = document.getElementById('address-state');
      const zipEl = document.getElementById('address-zip');
      
      if (streetEl) streetEl.textContent = user.address.street;
      if (cityEl) cityEl.textContent = user.address.city || '';
      if (stateEl) stateEl.textContent = user.address.state || '';
      if (zipEl) zipEl.textContent = user.address.zip || '';
      
      if (addressDisplay) addressDisplay.style.display = 'block';
      if (noAddress) noAddress.style.display = 'none';
    } else {
      if (addressDisplay) addressDisplay.style.display = 'none';
      if (noAddress) noAddress.style.display = 'block';
    }
    
    // Display interests
    const interestsEl = document.getElementById('user-interests');
    if (interestsEl) {
      if (user.interests && user.interests.length > 0) {
        const interestsHtml = user.interests.map(interest => 
          `<span class="interest-tag">${interest}</span>`
        ).join('');
        interestsEl.innerHTML = interestsHtml;
      } else {
        interestsEl.innerHTML = '<em>No topics selected</em>';
      }
    }
  }

  displaySubscriptionData(subData) {
    const statusBadge = document.getElementById('status-badge');
    const currentPlan = document.getElementById('current-plan');
    const subscriptionInfo = document.getElementById('subscription-info');
    const nextBilling = document.getElementById('next-billing');
    const billingDate = document.getElementById('billing-date');
    const manageBtn = document.getElementById('manage-subscription-btn');
    const startBtn = document.getElementById('start-subscription-btn');

    if (!statusBadge || !currentPlan || !subscriptionInfo) {
      console.error('❌ Subscription elements not found');
      return;
    }

    // Set status badge
    statusBadge.className = `badge ${subData.status}`;
    
    if (subData.status === 'no_subscription') {
      statusBadge.textContent = 'No Subscription';
      currentPlan.textContent = 'No active subscription';
      subscriptionInfo.textContent = 'You currently don\'t have an active subscription.';
      if (nextBilling) nextBilling.style.display = 'none';
      if (manageBtn) manageBtn.style.display = 'none';
      if (startBtn) startBtn.style.display = 'inline-block';
    } else {
      statusBadge.textContent = subData.status.replace('_', ' ').toUpperCase();
      currentPlan.textContent = this.formatPlanName(subData.subscription.plan);
      subscriptionInfo.textContent = `Status: ${subData.subscription.status}`;
      
      if (subData.subscription.current_period_end && billingDate && nextBilling) {
        const endDate = new Date(subData.subscription.current_period_end * 1000);
        billingDate.textContent = endDate.toLocaleDateString();
        nextBilling.style.display = 'block';
      }
      
      if (manageBtn) manageBtn.style.display = 'inline-block';
      if (startBtn) startBtn.style.display = 'none';
    }
  }

  formatPlanName(planId) {
    // Convert plan ID to readable name
    const planNames = {
      'basic': 'Basic Connection - $35/month',
      'premium': 'Premium Connection - $59/month', 
      'deluxe': 'Deluxe Connection - $119/month'
    };
    
    return planNames[planId] || planId || 'Unknown Plan';
  }

  setupEventListeners() {
    // Manage subscription button
    const manageBtn = document.getElementById('manage-subscription-btn');
    if (manageBtn) {
      manageBtn.addEventListener('click', async () => {
        try {
          const response = await apiClient.get('subscription/portal');
          window.location.href = response.url;
        } catch (error) {
          alert('Failed to open billing portal. Please try again.');
        }
      });
    }

    // Start subscription button
    const startBtn = document.getElementById('start-subscription-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        window.location.href = '/onboarding/experience';
      });
    }

    // Edit profile button
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        // You can implement a modal or redirect to edit page
        alert('Profile editing coming soon!');
      });
    }

    // Edit interests button
    const editInterestsBtn = document.getElementById('edit-interests-btn');
    if (editInterestsBtn) {
      editInterestsBtn.addEventListener('click', () => {
        window.location.href = '/app/topics';
      });
    }

    // Retry button
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.showLoading();
        this.hideError();
        this.hideMainContent();
        this.loadAccountData();
      });
    }
  }

  showLoading() {
    if (this.loadingState) this.loadingState.style.display = 'block';
  }

  hideLoading() {
    if (this.loadingState) this.loadingState.style.display = 'none';
  }

  showError(title, message) {
    const errorTitle = document.querySelector('#error-state h3');
    const errorDetails = document.getElementById('error-details');
    
    if (errorTitle) errorTitle.textContent = title;
    if (errorDetails) errorDetails.textContent = message;
    if (this.errorState) this.errorState.style.display = 'block';
    this.hideLoading();
  }

  hideError() {
    if (this.errorState) this.errorState.style.display = 'none';
  }

  showMainContent() {
    if (this.mainContent) this.mainContent.style.display = 'block';
  }

  hideMainContent() {
    if (this.mainContent) this.mainContent.style.display = 'none';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AccountPage();
});