// /assets/js/lib/onboarding.mjs
import config from './config.mjs';
import { getOrCreateUserProfile as getUser, getToken } from '../authentication.mjs'; // Adjust path as needed

/**
 * Save onboarding step data by POSTing to backend Netlify function.
 */
export async function saveOnboardingStep(step, data) {
  const token = getToken(); // Get the stored access token
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

/**
 * Check if user needs onboarding and return current step.
 * Returns an object: { needsOnboarding: boolean, currentStep: string }
 */
export async function checkOnboardingStatus() {
  const user = await getUser();
  if (!user) throw new Error('User profile not found');

  const needsOnboarding = !user.profileComplete;
  const currentStep = user.profileStep || 'welcome';

  return { needsOnboarding, currentStep };
}

/**
 * Load shared header partial and mark current onboarding step active.
 */
export async function loadHeader(step, containerId = 'onboarding-header') {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch('/onboarding/partials/header.html');
    if (!res.ok) throw new Error('Failed to load header partial');
    let html = await res.text();

    html = html.replace(/\$\{step === '(\w+)' \? 'active' : ''\}/g, (_, matchStep) =>
      matchStep === step ? 'active' : ''
    );

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<p>Error loading header.</p>`;
    console.error('loadHeader error:', err);
  }
}

/**
 * Centralized form submission handler.
 */
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

/**
 * Onboarding step handlers.
 */
export async function runWelcomeStep() {
  const step = 'welcome';
  const { checkAuthentication } = await import('../authentication.mjs');
  checkAuthentication();
  await loadHeader(step);

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
  await checkAuthentication();
  await loadHeader(step);

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

        // Return address fields directly, NOT wrapped inside an 'address' key
        return {
          street,
          city,
          state,
          zipCode,
        };
      },
      `${config.onboarding.redirectPath}/interests`
    );
  });
}

export async function runInterestsStep() {
  const step = 'interests';
  const { checkAuthentication } = await import('../authentication.mjs');
  await checkAuthentication();
  await loadHeader(step);

  const form = document.getElementById('onboarding-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const errorDiv = document.getElementById('onboarding-error');

    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }
    if (submitBtn) submitBtn.disabled = true;

    const selectedInterests = Array.from(
      document.querySelectorAll('input[name="interests"]:checked')
    ).map(el => el.value);

    if (selectedInterests.length < 3) {
      if (errorDiv) {
        errorDiv.textContent = 'Please select at least 3 interests.';
        errorDiv.style.display = 'block';
      } else {
        alert('Please select at least 3 interests.');
      }
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    try {
      await saveOnboardingStep(step, { interests: selectedInterests });
      window.location.href = `${config.onboarding.redirectPath}/complete`;
    } catch (error) {
      if (errorDiv) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
      } else {
        alert(error.message);
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

export async function runCompleteStep() {
  const step = 'complete';
  const { checkAuthentication } = await import('../authentication.mjs');
  await checkAuthentication();
  await loadHeader(step);

  const completeBtn = document.getElementById('complete-btn');
  if (completeBtn) {
    completeBtn.addEventListener('click', async () => {
      try {
        await saveOnboardingStep(step, { profileComplete: true });
        window.location.href = '/dashboard';
      } catch (error) {
        alert('Failed to complete setup. Please try again.');
        console.error('Completion error:', error);
      }
    });
  }

  setTimeout(async () => {
    try {
      await saveOnboardingStep(step, { profileComplete: true });
      window.location.href = '/app/dashboard';
    } catch {
      // ignore error here
    }
  }, 5000);
}

export async function runExperienceStep() {
  const step = 'experience';
  const { checkAuthentication } = await import('../authentication.mjs');
  await checkAuthentication();
  await loadHeader(step);

  const form = document.getElementById('onboarding-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    handleFormSubmit(
      e,
      step,
      () => {
        return {}; // Collect actual data here if needed
      },
      `${config.onboarding.redirectPath}/complete`
    );
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
