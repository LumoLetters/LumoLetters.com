// assets/js/payment.mjs
import config from './lib/config.mjs';
import { apiClient } from './lib/api-client.mjs';
import { eventBus } from './lib/event-bus.mjs';
import { ENDPOINTS } from './lib/constants.mjs';
import { loadStripe } from '@stripe/stripe-js';

class PaymentManager {
  constructor() {
    this.isProcessing = false;
    this.selectedPlan = null;
    this.stripe = null;
    this.initializeEventListeners();
    this.initializeStripe();
  }

  async initializeStripe() {
    try {
      this.stripe = await loadStripe(config.stripe.publicKey);
    } catch (error) {
      console.error('Stripe initialization failed:', error);
      this.showError('Payment system is unavailable. Please try again later.');
    }
  }

  initializeEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-plan-select]')) {
        this.handlePlanSelection(e);
      }
      
      if (e.target.matches('[data-checkout-btn]')) {
        this.handleCheckout(e);
      }
      
      if (e.target.matches('[data-manage-subscription]')) {
        this.handleManageSubscription(e);
      }
    });

    eventBus.addEventListener('subscription:updated', (event) => {
      this.updateUI(event.detail);
    });
  }

  handlePlanSelection(event) {
    event.preventDefault();
    
    // Remove previous selections
    document.querySelectorAll('[data-plan-card]').forEach(card => {
      card.classList.remove('selected', 'ring-2', 'ring-blue-500');
    });
    
    // Add selection to clicked card
    const planCard = event.target.closest('[data-plan-card]');
    planCard.classList.add('selected', 'ring-2', 'ring-blue-500');
    
    // Store selected plan data
    this.selectedPlan = {
      id: event.target.dataset.planSelect,
      priceId: event.target.dataset.priceId,
      name: event.target.dataset.planName,
      price: event.target.dataset.planPrice
    };
    
    // Enable checkout button
    const checkoutBtn = document.querySelector('[data-checkout-btn]');
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      checkoutBtn.classList.add('hover:bg-blue-700');
    }
    
    // Update checkout button text
    const btnText = checkoutBtn?.querySelector('[data-checkout-text]');
    if (btnText) {
      btnText.textContent = `Subscribe to ${this.selectedPlan.name} - $${this.selectedPlan.price}/month`;
    }
  }

  async handleCheckout(event) {
    event.preventDefault();
    
    if (this.isProcessing || !this.selectedPlan || !this.stripe) {
      return;
    }
    
    this.isProcessing = true;
    this.updateCheckoutButton(true);
    
    try {
      // Create checkout session
      const response = await apiClient.post(
        `/${ENDPOINTS.SUBSCRIPTION}/create-checkout`,
        {
          priceId: this.selectedPlan.priceId,
          successUrl: `${window.location.origin}/onboarding/complete?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/onboarding/experience`
        }
      );
      
      // Redirect to Stripe Checkout
      const { error } = await this.stripe.redirectToCheckout({
        sessionId: response.sessionId
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      this.showError(this.getErrorMessage(error));
    } finally {
      this.isProcessing = false;
      this.updateCheckoutButton(false);
    }
  }

  async handleManageSubscription(event) {
    event.preventDefault();
    
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    try {
      const response = await apiClient.get(`/${ENDPOINTS.SUBSCRIPTION}/portal`);
      
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Customer portal error:', error);
      this.showError('Failed to open subscription management. Please try again.');
    } finally {
      this.isProcessing = false;
    }
  }

  async getSubscriptionStatus() {
    try {
      const response = await apiClient.get(`/${ENDPOINTS.SUBSCRIPTION}/status`);
      return response;
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { status: 'error' };
    }
  }

  updateCheckoutButton(processing) {
    const btn = document.querySelector('[data-checkout-btn]');
    const btnText = btn?.querySelector('[data-checkout-text]');
    const spinner = btn?.querySelector('[data-checkout-spinner]');
    
    if (!btn) return;
    
    if (processing) {
      btn.disabled = true;
      btn.classList.add('opacity-75');
      if (btnText) btnText.textContent = 'Processing...';
      if (spinner) spinner.classList.remove('hidden');
    } else {
      btn.disabled = !this.selectedPlan;
      btn.classList.remove('opacity-75');
      if (btnText && this.selectedPlan) {
        btnText.textContent = `Subscribe to ${this.selectedPlan.name} - $${this.selectedPlan.price}/month`;
      }
      if (spinner) spinner.classList.add('hidden');
    }
  }

  updateUI(subscriptionData) {
    const statusElements = document.querySelectorAll('[data-subscription-status]');
    const planElements = document.querySelectorAll('[data-current-plan]');
    const manageBtn = document.querySelector('[data-manage-subscription]');
    
    // Update status display
    statusElements.forEach(el => {
      el.textContent = subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1);
      el.className = subscriptionData.status === 'active' 
        ? 'text-green-600 font-semibold' 
        : 'text-gray-500';
    });
    
    // Update plan name
    if (subscriptionData.subscription) {
      planElements.forEach(el => {
        el.textContent = subscriptionData.subscription.plan || 'Unknown Plan';
      });
    }
    
    // Show/hide management button
    if (manageBtn) {
      manageBtn.style.display = subscriptionData.status === 'active' 
        ? 'inline-block' 
        : 'none';
    }
  }

  async initializeSubscriptionStatus() {
    try {
      const status = await this.getSubscriptionStatus();
      this.updateUI(status);
      
      // Emit event for other components
      eventBus.dispatchEvent('subscription:loaded', status);
    } catch (error) {
      console.error('Subscription status init error:', error);
    }
  }

  showError(message) {
    // Create or update error message element
    let errorEl = document.querySelector('[data-payment-error]');
    
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.setAttribute('data-payment-error', '');
      errorEl.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 transition-opacity duration-300';
      errorEl.style.position = 'fixed';
      errorEl.style.top = '20px';
      errorEl.style.right = '20px';
      errorEl.style.zIndex = '1000';
      
      document.body.appendChild(errorEl);
    }
    
    errorEl.textContent = message;
    errorEl.classList.remove('hidden', 'opacity-0');
    errorEl.classList.add('block', 'opacity-100');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorEl.classList.add('opacity-0');
      setTimeout(() => errorEl.classList.add('hidden'), 300);
    }, 5000);
  }

  getErrorMessage(error) {
    const errorMap = {
      'missing_price': 'Please select a subscription plan',
      'rate_limit': 'Too many requests, please try again later',
      'authentication_failed': 'Please login to subscribe',
      'card_declined': 'Your card was declined. Please try another payment method',
      'default': 'Failed to start checkout. Please try again.'
    };
    
    // Handle Stripe errors
    if (error.type === 'StripeCardError') {
      return error.message || 'Card error occurred';
    }
    
    return errorMap[error.code] || error.message || errorMap.default;
  }
}

export const paymentManager = new PaymentManager();

// Auto-initialize on relevant pages
document.addEventListener('DOMContentLoaded', () => {
  const isDashboard = document.body.classList.contains('dashboard-page');
  const isAccount = document.body.classList.contains('account-page');
  const isPricing = document.body.classList.contains('pricing-page');
  
  if (isDashboard || isAccount) {
    paymentManager.initializeSubscriptionStatus();
  }
  
  if (isPricing && document.querySelector('[data-plan-select]')) {
    paymentManager.updateCheckoutButton(false);
  }
});