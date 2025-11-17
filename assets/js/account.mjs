// /assets/js/account.mjs - Fixed Version
import apiClient from './lib/api-client.mjs';

class AccountPage {
  constructor() {
    // Update these selectors to match your new HTML
    this.loadingState = document.getElementById('account-loading');
    this.errorState = document.getElementById('account-error');
    this.mainContent = document.getElementById('account-content');
    this.state = {
      userProfile: null,
      subscription: null,
      isLoading: true,
      hasError: false
    };
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
      
      // Verify critical elements exist with NEW IDs
      if (!this.mainContent) {
        console.error('❌ Main content container not found! Looking for #account-content');
        console.log('Available account elements:');
        console.log('  - #account-loading:', !!document.getElementById('account-loading'));
        console.log('  - #account-error:', !!document.getElementById('account-error'));
        console.log('  - #account-content:', !!document.getElementById('account-content'));
        console.log('  - #user-name:', !!document.getElementById('user-name'));
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
      this.showLoading();
      this.hideError();
      this.hideMainContent();
      
      // Use the existing authentication function that already handles this
      const authentication = await import('./authentication.mjs');
      const [userData, subscriptionData] = await Promise.all([
        authentication.default.getOrCreateUserProfile(),
        this.loadSubscriptionData()
      ]);
      
      console.log('✅ User data received:', userData);
      console.log('✅ Subscription data received:', subscriptionData);
      
      this.state.userProfile = userData;
      this.state.subscription = subscriptionData;
      this.state.hasError = false;
      
      this.displayUserData(userData);
      this.displaySubscriptionData(subscriptionData);
      this.displayTopicsInfo(userData);
      
      this.hideLoading();
      this.showMainContent();
      
    } catch (error) {
      console.error('❌ Error loading account data:', error);
      this.state.hasError = true;
      this.showError('Failed to load account', error.message);
    } finally {
      this.state.isLoading = false;
    }
  }

  async loadSubscriptionData() {
    try {
      console.log('📡 Calling subscription/status endpoint...');
      const subResponse = await apiClient.get('subscription/status');
      return subResponse;
    } catch (error) {
      console.error('Error loading subscription:', error);
      // Return fallback subscription data
      return {
        status: 'no_subscription',
        subscription: null
      };
    }
  }

  displayUserData(user) {
    console.log('📝 Displaying user data:', user);
    
    // Update with new element structure
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');
    const joinEl = document.getElementById('user-joined');
    
    if (nameEl) {
      nameEl.textContent = user.name || 'Not provided';
    }
    
    if (emailEl) {
      emailEl.textContent = user.email || 'Not provided';
    }
    
    if (joinEl) {
      const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently';
      joinEl.textContent = joinDate;
    }
  }

  displaySubscriptionData(subData) {
    const statusBadge = document.getElementById('subscription-badge');
    const descriptionEl = document.getElementById('subscription-description');
    const billingEl = document.getElementById('billing-info');
    const billingDate = document.getElementById('billing-date');
    const manageBtn = document.getElementById('manage-subscription-btn');
    const startBtn = document.getElementById('start-subscription-btn');

    if (!statusBadge || !descriptionEl) {
      console.error('❌ Subscription elements not found');
      return;
    }

    if (subData.status === 'no_subscription' || !subData.subscription) {
      statusBadge.textContent = 'Inactive';
      statusBadge.className = 'subscription-status__badge subscription-status__badge--inactive';
      descriptionEl.textContent = 'You are not currently subscribed to a paid plan.';
      
      this.hideElement(billingEl);
      this.hideElement(manageBtn);
      this.showElement(startBtn);
      
    } else {
      const subscription = subData.subscription;
      statusBadge.textContent = subscription.status.replace('_', ' ').toUpperCase();
      statusBadge.className = 'subscription-status__badge subscription-status__badge--active';
      descriptionEl.textContent = `You're subscribed to the ${this.formatPlanName(subscription.plan)} plan.`;
      
      if (subscription.current_period_end && billingDate) {
        const endDate = new Date(subscription.current_period_end * 1000);
        billingDate.textContent = endDate.toLocaleDateString();
        this.showElement(billingEl);
      }
      
      this.showElement(manageBtn);
      this.hideElement(startBtn);
    }
  }

  displayTopicsInfo(user) {
    const interests = user.interests || [];
    const countEl = document.getElementById('topics-count');
    const previewEl = document.getElementById('topics-preview');
    
    if (countEl) {
      countEl.textContent = interests.length;
    }
    
    if (previewEl) {
      if (interests.length === 0) {
        previewEl.innerHTML = '<p class="text-muted">No topics selected yet.</p>';
      } else {
        const topicsHtml = interests.slice(0, 5).map(topic => 
          `<span class="topic-tag">${topic}</span>`
        ).join('');
        
        const moreText = interests.length > 5 ? 
          `<span class="text-muted">+${interests.length - 5} more</span>` : '';
        
        previewEl.innerHTML = topicsHtml + moreText;
      }
    }
  }

  formatPlanName(planId) {
    const planNames = {
      'basic': 'Basic Connection',
      'premium': 'Premium Connection', 
      'deluxe': 'Deluxe Connection'
    };
    
    return planNames[planId] || planId || 'Unknown Plan';
  }

  setupEventListeners() {
    // Subscription buttons
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

    const startBtn = document.getElementById('start-subscription-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        window.location.href = '/onboarding/experience';
      });
    }

    // Edit interests button - using the new "Manage Topics" link
    const editInterestsBtn = document.getElementById('edit-interests-btn');
    if (editInterestsBtn) {
      editInterestsBtn.addEventListener('click', () => {
        window.location.href = '/app/topics';
      });
    }

    // Profile editing
    this.setupProfileEditing();
    this.setupAccountActions();
    
    // Retry button - check if it exists in new HTML
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.loadAccountData();
      });
    }
  }

  setupProfileEditing() {
    const editBtn = document.getElementById('edit-profile-btn');
    const closeBtn = document.getElementById('close-profile-modal');
    const cancelBtn = document.getElementById('cancel-profile-edit');
    const form = document.getElementById('profile-form');
    const modal = document.getElementById('edit-profile-modal');
    
    if (!editBtn || !modal) {
      console.log('⚠️ Profile editing elements not found - modal might not be in HTML');
      return;
    }
    
    editBtn.addEventListener('click', () => {
      if (this.state.userProfile) {
        document.getElementById('edit-name').value = this.state.userProfile.name || '';
        document.getElementById('edit-email').value = this.state.userProfile.email || '';
        this.showElement(modal);
      }
    });
    
    [closeBtn, cancelBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          this.hideElement(modal);
        });
      }
    });
    
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.updateProfile();
      });
    }
  }

  async updateProfile() {
    const form = document.getElementById('profile-form');
    if (!form) return;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      
      const formData = {
        name: document.getElementById('edit-name').value,
        email: document.getElementById('edit-email').value
      };
      
      await apiClient.put('auth-user', formData);
      this.state.userProfile = { ...this.state.userProfile, ...formData };
      this.displayUserData(this.state.userProfile);
      
      this.hideElement(document.getElementById('edit-profile-modal'));
      this.showSuccessNotification();
      
      console.log('✅ Profile updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  setupAccountActions() {
    const logoutBtn = document.getElementById('logout-btn');
    const deleteBtn = document.getElementById('delete-account-btn');
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          const authentication = await import('./authentication.mjs');
          await authentication.default.logout();
          window.location.href = '/';
        } catch (error) {
          console.error('Error during logout:', error);
          alert('Failed to log out. Please try again.');
        }
      });
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
          this.deleteAccount();
        }
      });
    }
  }

  async deleteAccount() {
    try {
      const deleteBtn = document.getElementById('delete-account-btn');
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';
      
      await apiClient.delete('auth-user');
      
      const authentication = await import('./authentication.mjs');
      await authentication.default.logout();
      window.location.href = '/?account_deleted=true';
      
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
      
      const deleteBtn = document.getElementById('delete-account-btn');
      if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete Account';
      }
    }
  }

  // UI Helper Methods
  showElement(element) {
    if (element) element.classList.remove('hidden');
  }

  hideElement(element) {
    if (element) element.classList.add('hidden');
  }

  showLoading() {
    this.showElement(this.loadingState);
  }

  hideLoading() {
    this.hideElement(this.loadingState);
  }

  showError(title, message) {
    const errorText = this.errorState?.querySelector('p');
    if (errorText) {
      errorText.textContent = message || 'We couldn\'t load your account details right now. Please try refreshing the page.';
    }
    this.hideLoading();
    this.showElement(this.errorState);
  }

  hideError() {
    this.hideElement(this.errorState);
  }

  showMainContent() {
    this.showElement(this.mainContent);
  }

  hideMainContent() {
    this.hideElement(this.mainContent);
  }

  showSuccessNotification() {
    const successEl = document.getElementById('profile-update-success');
    if (!successEl) return;
    
    this.showElement(successEl);
    
    setTimeout(() => {
      this.hideElement(successEl);
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AccountPage();
});