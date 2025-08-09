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
      await this.loadAccountData();
      this.setupEventListeners();
    } catch (error) {
      this.showError('Failed to load account information', error.message);
    }
  }

  async loadAccountData() {
    try {
      // Load user profile - API returns user data directly
      const userData = await apiClient.get('auth-user');
      
      // Load subscription status
      const subResponse = await apiClient.get('subscription/status');
      
      this.displayUserData(userData);
      this.displaySubscriptionData(subResponse);
      
      this.hideLoading();
      this.showMainContent();
      
    } catch (error) {
      console.error('Error loading account data:', error);
      throw error;
    }
  }

  displayUserData(user) {
    document.getElementById('user-name').textContent = user.name || 'Not provided';
    document.getElementById('user-email').textContent = user.email || 'Not provided';
    
    // Display address
    if (user.address && user.address.street) {
      document.getElementById('address-street').textContent = user.address.street;
      document.getElementById('address-city').textContent = user.address.city || '';
      document.getElementById('address-state').textContent = user.address.state || '';
      document.getElementById('address-zip').textContent = user.address.zip || '';
      document.getElementById('address-display').style.display = 'block';
      document.getElementById('no-address').style.display = 'none';
    } else {
      document.getElementById('address-display').style.display = 'none';
      document.getElementById('no-address').style.display = 'block';
    }
    
    // Display interests
    if (user.interests && user.interests.length > 0) {
      const interestsHtml = user.interests.map(interest => 
        `<span class="interest-tag">${interest}</span>`
      ).join('');
      document.getElementById('user-interests').innerHTML = interestsHtml;
    } else {
      document.getElementById('user-interests').innerHTML = '<em>No topics selected</em>';
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

    // Set status badge
    statusBadge.className = `badge ${subData.status}`;
    
    if (subData.status === 'no_subscription') {
      statusBadge.textContent = 'No Subscription';
      currentPlan.textContent = 'No active subscription';
      subscriptionInfo.textContent = 'You currently don\'t have an active subscription.';
      nextBilling.style.display = 'none';
      manageBtn.style.display = 'none';
      startBtn.style.display = 'inline-block';
    } else {
      statusBadge.textContent = subData.status.replace('_', ' ').toUpperCase();
      currentPlan.textContent = this.formatPlanName(subData.subscription.plan);
      subscriptionInfo.textContent = `Status: ${subData.subscription.status}`;
      
      if (subData.subscription.current_period_end) {
        const endDate = new Date(subData.subscription.current_period_end * 1000);
        billingDate.textContent = endDate.toLocaleDateString();
        nextBilling.style.display = 'block';
      }
      
      manageBtn.style.display = 'inline-block';
      startBtn.style.display = 'none';
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
    document.getElementById('manage-subscription-btn').addEventListener('click', async () => {
      try {
        const response = await apiClient.get('subscription/portal');
        window.location.href = response.url;
      } catch (error) {
        alert('Failed to open billing portal. Please try again.');
      }
    });

    // Start subscription button
    document.getElementById('start-subscription-btn').addEventListener('click', () => {
      window.location.href = '/onboarding/experience';
    });

    // Edit profile button
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
      // You can implement a modal or redirect to edit page
      alert('Profile editing coming soon!');
    });

    // Edit interests button
    document.getElementById('edit-interests-btn').addEventListener('click', () => {
      window.location.href = '/app/topics';
    });

    // Retry button
    document.getElementById('retry-btn').addEventListener('click', () => {
      this.showLoading();
      this.hideError();
      this.hideMainContent();
      this.loadAccountData();
    });
  }

  showLoading() {
    this.loadingState.style.display = 'block';
  }

  hideLoading() {
    this.loadingState.style.display = 'none';
  }

  showError(title, message) {
    document.querySelector('#error-state h3').textContent = title;
    document.getElementById('error-details').textContent = message;
    this.errorState.style.display = 'block';
    this.hideLoading();
  }

  hideError() {
    this.errorState.style.display = 'none';
  }

  showMainContent() {
    this.mainContent.style.display = 'block';
  }

  hideMainContent() {
    this.mainContent.style.display = 'none';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AccountPage();
});