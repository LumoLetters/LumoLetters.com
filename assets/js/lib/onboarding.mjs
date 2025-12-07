//assets/js/lib/onboarding.mjs

import { loadStripe } from '@stripe/stripe-js';
import config from './config.mjs';
import { getOrCreateUserProfile as getUser, getToken } from '../authentication.mjs';

// Load existing onboarding data from backend
export async function loadOnboardingData() {
  const token = getToken();
  if (!token) throw new Error('User is not authenticated');

  const response = await fetch(`${config.api.baseUrl}/onboarding`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.warn('Failed to load existing onboarding data:', response.status);
    return null;
  }

  return response.json();
}

// Populate form fields with existing data
function populateFormFields(step, data) {
  if (!data || !data.onboarding) return;

  const form = document.getElementById('onboarding-form');
  if (!form) return;

  try {
    switch (step) {
      case 'welcome':
        if (data.onboarding.welcome) {
          const nameInput = form.querySelector('#name');
          const newsletterCheckbox = form.querySelector('#newsletter');
          
          if (nameInput && data.onboarding.welcome.name) {
            nameInput.value = data.onboarding.welcome.name;
          }
          if (newsletterCheckbox && data.onboarding.welcome.subscribeNewsletter !== undefined) {
            newsletterCheckbox.checked = data.onboarding.welcome.subscribeNewsletter;
          }
        }
        break;

      case 'address':
        const addressData = data.address || data.onboarding.address;
        if (addressData) {
          const fields = ['street', 'city', 'state', 'zipCode'];
          fields.forEach(fieldName => {
            const input = form.querySelector(`#${fieldName}`);
            if (input && addressData[fieldName]) {
              input.value = addressData[fieldName];
            }
          });
        }
        break;

      case 'interests':
        if (data.onboarding.interests) {
          const interests = data.onboarding.interests;
          const selectedInterests = Array.isArray(interests) 
            ? interests 
            : (interests.interests || []);
          
          selectedInterests.forEach(interest => {
            const checkbox = form.querySelector(`input[name="interests"][value="${interest}"]`);
            if (checkbox) {
              checkbox.checked = true;
              
              // Find the parent card and add selected class
              const card = checkbox.closest('.topic-selection-card');
              if (card) {
                card.classList.add('selected');
                card.setAttribute('aria-checked', 'true');
              }
            }
          });
          
          // Update the counter
          const countElement = document.getElementById('selected-count');
          if (countElement) {
            countElement.textContent = selectedInterests.length;
          }
        }
        break;

      case 'experience':
        if (data.onboarding.experience?.plan) {
          const planRadio = form.querySelector(`input[name="plan"][value="${data.onboarding.experience.plan}"]`);
          if (planRadio) planRadio.checked = true;
        }
        break;
    }
  } catch (error) {
    console.error('Error populating form fields:', error);
  }
}

// Initialize step button click handlers
function initializeStepButtonsInline(currentStep) {
  const stepButtons = document.querySelectorAll('.step-button:not([disabled])');
  console.log('Initializing', stepButtons.length, 'step buttons');
  
  stepButtons.forEach(button => {
    button.style.cursor = 'pointer';
    
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const targetStep = this.dataset.target;
      console.log('Step button clicked:', targetStep);
      
      if (!targetStep || targetStep === currentStep) {
        return;
      }
      
      const stepOrder = ['welcome', 'address', 'interests', 'experience', 'complete'];
      const currentIndex = stepOrder.indexOf(currentStep);
      const targetIndex = stepOrder.indexOf(targetStep);
      
      // Only allow navigation back, not forward
      if (targetIndex > currentIndex) {
        console.log('Cannot skip ahead');
        const errorDiv = document.getElementById('onboarding-error');
        if (errorDiv) {
          errorDiv.textContent = 'Please complete the current step before moving ahead.';
          errorDiv.style.display = 'block';
          setTimeout(() => errorDiv.style.display = 'none', 3000);
        }
        return;
      }
      
      // Check for unsaved changes
      const form = document.querySelector('#onboarding-form');
      if (form) {
        const fields = form.querySelectorAll('input, select, textarea');
        let hasChanges = false;
        
        fields.forEach(field => {
          if (field.type === 'checkbox' || field.type === 'radio') {
            const originalChecked = field.dataset.originalChecked === 'true';
            if (field.checked !== originalChecked) hasChanges = true;
          } else {
            const originalValue = field.dataset.originalValue || '';
            if ((field.value || '') !== originalValue) hasChanges = true;
          }
        });
        
        if (hasChanges) {
          if (!confirm('You have unsaved changes. Are you sure you want to leave this page?')) {
            return;
          }
        }
      }
      
      // Navigate
      console.log('Navigating to:', `/onboarding/${targetStep}`);
      window.location.href = `/onboarding/${targetStep}`;
    });
  });
  
  // Store original form values
  setTimeout(() => {
    const form = document.querySelector('#onboarding-form');
    if (form) {
      const fields = form.querySelectorAll('input, select, textarea');
      fields.forEach(field => {
        if (field.type === 'checkbox' || field.type === 'radio') {
          field.dataset.originalChecked = field.checked;
        } else {
          field.dataset.originalValue = field.value || '';
        }
      });
    }
  }, 500);
}

// Save onboarding step data by POSTing to backend Netlify function.
export async function saveOnboardingStep(step, data) {
  const token = getToken();
  if (!token) throw new Error('User is not authenticated');

  const response = await fetch(`${config.api.baseUrl}/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ step, data }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save onboarding step');
  }

  return response.json();
}

// Check if user needs onboarding and return current step.
export async function checkOnboardingStatus() {
  const user = await getUser();
  if (!user) throw new Error('User profile not found');

  const needsOnboarding = !user.profileComplete;
  const currentStep = user.profileStep || 'welcome';

  return { needsOnboarding, currentStep };
}

//Load shared header partial and mark current onboarding step active.
export async function loadHeader(step, containerId = 'onboarding-header') {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch('/onboarding/partials/header.html');
    if (!res.ok) throw new Error('Failed to load header partial');
    let html = await res.text();

    // Replace all template expressions
    // Active class: ${step === 'welcome' ? 'active' : ''}
    html = html.replace(/\$\{step === '(\w+)' \? 'active' : ''\}/g, (_, matchStep) =>
      matchStep === step ? 'active' : ''
    );

    // Completed class: ${['address', 'interests'].includes(step) ? 'completed' : ''}
    html = html.replace(/\$\{\[([^\]]+)\]\.includes\(step\) \? 'completed' : ''\}/g, (match, stepsStr) => {
      const steps = stepsStr.split(',').map(s => s.trim().replace(/['"]/g, ''));
      return steps.includes(step) ? 'completed' : '';
    });

    // Disabled attribute: ${['address', 'interests'].includes(step) ? '' : 'disabled'}
    html = html.replace(/\$\{\[([^\]]+)\]\.includes\(step\) \? '' : 'disabled'\}/g, (match, stepsStr) => {
      const steps = stepsStr.split(',').map(s => s.trim().replace(/['"]/g, ''));
      return steps.includes(step) ? '' : 'disabled';
    });

    // Special case for complete step
    html = html.replace(/\$\{step === 'complete' \? 'completed' : ''\}/g, 
      step === 'complete' ? 'completed' : ''
    );

    container.innerHTML = html;
    
    // Initialize step buttons immediately after header loads
    initializeStepButtonsInline(step);
    
  } catch (err) {
    container.innerHTML = `<p>Error loading header.</p>`;
    console.error('loadHeader error:', err);
  }
}

//Centralized form submission handler.
async function handleFormSubmit(
  event,
  step,
  collectDataFn,
  redirectUrl,
  errorDivId = 'onboarding-error',
  submitBtnId = 'submit-btn'
) {
  event.preventDefault();

  const submitBtn = document.getElementById(submitBtnId);
  const errorDiv = document.getElementById(errorDivId);

  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }
  if (submitBtn) submitBtn.disabled = true;

  try {
    const data = collectDataFn();

    if (!data || Object.values(data).some(val => val === undefined || val === null || val === '')) {
      throw new Error('Please fill in all required fields.');
    }

    await saveOnboardingStep(step, data);
    window.location.href = redirectUrl;
  } catch (error) {
    console.error('Form submission error:', error);
    if (errorDiv) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    } else {
      alert(error.message);
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

//Onboarding step handlers.
export async function runWelcomeStep() {
  const step = 'welcome';
  
  // Import authentication but don't block - just ensure user is set up
  const { checkAuthentication } = await import('../authentication.mjs');
  
  try {
    // Check if user is authenticated, if not this will handle the login
    await checkAuthentication();
  } catch (error) {
    console.error('Authentication check failed:', error);
    // If authentication fails, redirect to login
    // Auth0 will redirect back to this page after login
    const auth0 = await import('../authentication.mjs');
    auth0.login();
    return;
  }
  
  await loadHeader(step);

  // Load and populate existing data
  try {
    const existingData = await loadOnboardingData();
    populateFormFields(step, existingData);
  } catch (error) {
    console.warn('Could not load existing data:', error);
  }

  const form = document.getElementById('onboarding-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    handleFormSubmit(
      e,
      step,
      () => ({
        name: form.name.value.trim(),
        subscribeNewsletter: form.newsletter.checked,
      }),
      `${config.onboarding.redirectPath}/address`
    );
  });
}

export async function runAddressStep() {
  const step = 'address';
  const { checkAuthentication } = await import('../authentication.mjs');
  
  try {
    await checkAuthentication();
  } catch (error) {
    console.error('Authentication required:', error);
    window.location.href = '/onboarding/welcome';
    return;
  }
  
  await loadHeader(step);

  // Load and populate existing data
  try {
    const existingData = await loadOnboardingData();
    populateFormFields(step, existingData);
  } catch (error) {
    console.warn('Could not load existing data:', error);
  }

  const form = document.getElementById('onboarding-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    handleFormSubmit(
      e,
      step,
      () => {
        const street = form.street.value.trim();
        const city = form.city.value.trim();
        const state = form.state.value;
        const zipCode = form.zipCode.value.trim();

        if (!/^\d{5}$/.test(zipCode)) {
          throw new Error('Please enter a valid 5-digit ZIP code.');
        }
        return { street, city, state, zipCode };
      },
      `${config.onboarding.redirectPath}/interests`
    );
  });
}

export async function runInterestsStep() {
  const step = 'interests';
  const { checkAuthentication } = await import('../authentication.mjs');
  
  try {
    await checkAuthentication();
  } catch (error) {
    console.error('Authentication required:', error);
    window.location.href = '/onboarding/welcome';
    return;
  }
  
  await loadHeader(step);

  // Load and populate existing data
  try {
    const existingData = await loadOnboardingData();
    populateFormFields(step, existingData);
  } catch (error) {
    console.warn('Could not load existing data:', error);
  }

  const form = document.getElementById('onboarding-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    handleFormSubmit(
      e,
      step,
      () => {
        const selectedInterests = Array.from(
          document.querySelectorAll('input[name="interests"]:checked')
        ).map(el => el.value);

        if (selectedInterests.length < 3) {
          throw new Error('Please select at least 3 topics to continue.');
        }
        
        return { interests: selectedInterests };
      },
      `${config.onboarding.redirectPath}/experience`
    );
  });
}

export async function runCompleteStep() {
  const step = 'complete';
  const { checkAuthentication } = await import('../authentication.mjs');
  
  try {
    await checkAuthentication();
  } catch (error) {
    console.error('Authentication required:', error);
    window.location.href = '/onboarding/welcome';
    return;
  }
  
  await loadHeader(step);

  const completeBtn = document.getElementById('complete-btn');
  if (completeBtn) {
    completeBtn.addEventListener('click', async () => {
      try {
        await saveOnboardingStep(step, { profileComplete: true });
        window.location.href = '/app/dashboard';
      } catch (error) {
        alert('Failed to complete setup. Please try again.');
        console.error('Completion error:', error);
      }
    });
  }

  // Auto-redirect after 5 seconds
  setTimeout(async () => {
    try {
      await saveOnboardingStep(step, { profileComplete: true });
      window.location.href = '/app/dashboard';
    } catch (error) {
      console.error('Auto-complete error:', error);
    }
  }, 5000);
}

export async function runExperienceStep() {
  const step = 'experience';
  const { checkAuthentication } = await import('../authentication.mjs');
  
  try {
    await checkAuthentication();
  } catch (error) {
    console.error('Authentication required:', error);
    window.location.href = '/onboarding/welcome';
    return;
  }
  
  await loadHeader(step);

  // Load and populate existing data
  try {
    const existingData = await loadOnboardingData();
    populateFormFields(step, existingData);
  } catch (error) {
    console.warn('Could not load existing data:', error);
  }

  const form = document.getElementById('onboarding-form');
  if (!form) return;

  const submitBtn = document.getElementById('submit-btn');
  const errorDiv = document.getElementById('onboarding-error');

  // Lazy-load Stripe
  let stripe;
  try {
    stripe = await loadStripe(config.stripe.publicKey);
    if (!stripe) throw new Error('Stripe.js failed to initialize');
  } catch (error) {
    console.error('Stripe initialization error:', error);
    if (errorDiv) {
      errorDiv.textContent = 'Payment system could not be loaded. Please refresh the page.';
      errorDiv.style.display = 'block';
    }
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!stripe) return;

    submitBtn.disabled = true;
    errorDiv.style.display = 'none';
    submitBtn.textContent = 'Processing...';

    try {
      const selectedPlan = document.querySelector('input[name="plan"]:checked');
      if (!selectedPlan) {
        throw new Error('Please select a plan to continue.');
      }

      const priceId = selectedPlan.value;
      const token = getToken();
      if (!token) throw new Error('User is not authenticated');

      // Call backend to create Checkout session
      const response = await fetch(`${config.api.baseUrl}/subscription/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Could not create payment session.');
      }

      const { sessionId } = await response.json();

      // Stripe redirect
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw new Error(error.message);

    } catch (error) {
      console.error('Checkout error:', error);
      if (errorDiv) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
      } else {
        alert(error.message);
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue to Payment';
    }
  });
}

const onboardingSteps = {
  welcome: runWelcomeStep,
  address: runAddressStep,
  interests: runInterestsStep,
  complete: runCompleteStep,
  experience: runExperienceStep,
};

async function runCurrentStep() {
  const step = document.body.dataset.onboardingStep;
  if (!step || !(step in onboardingSteps)) {
    console.warn('No onboarding step detected or invalid step:', step);
    return;
  }
  await onboardingSteps[step]();
}

document.addEventListener('DOMContentLoaded', runCurrentStep);