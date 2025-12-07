// assets/js/onboarding-header.js

// Navigate to a specific onboarding step
window.navigateToStep = function(targetStep) {
  const currentStep = document.body.dataset.onboardingStep;
  
  console.log('Navigate from', currentStep, 'to', targetStep);
  
  // Already on this step
  if (targetStep === currentStep) {
    return;
  }
  
  const stepOrder = ['welcome', 'address', 'interests', 'experience', 'complete'];
  const currentIndex = stepOrder.indexOf(currentStep);
  const targetIndex = stepOrder.indexOf(targetStep);
  
  // Only allow navigation to current or previous steps (can't skip ahead)
  if (targetIndex > currentIndex) {
    console.log('Cannot skip ahead to future steps');
    showError('Please complete the current step before moving ahead.');
    return;
  }
  
  // Check for unsaved changes
  if (window.hasUnsavedChanges && window.hasUnsavedChanges()) {
    if (!confirm('You have unsaved changes. Are you sure you want to leave this page?')) {
      return;
    }
  }
  
  // Navigate to the target step
  console.log('Navigating to:', `/onboarding/${targetStep}`);
  window.location.href = `/onboarding/${targetStep}`;
};

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('onboarding-error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 3000);
  }
}

// Track if form has unsaved changes
window.hasUnsavedChanges = function() {
  const form = document.querySelector('#onboarding-form');
  if (!form) return false;
  
  // Check if any field has been modified
  const fields = form.querySelectorAll('input, select, textarea');
  let hasChanges = false;
  
  fields.forEach(field => {
    // Compare current value with original value stored in data attribute
    const originalValue = field.dataset.originalValue || '';
    
    if (field.type === 'checkbox' || field.type === 'radio') {
      const originalChecked = field.dataset.originalChecked === 'true';
      if (field.checked !== originalChecked) {
        hasChanges = true;
      }
    } else {
      const currentValue = field.value || '';
      if (currentValue !== originalValue) {
        hasChanges = true;
      }
    }
  });
  
  return hasChanges;
};

// Store original form values after page loads
function storeOriginalFormValues() {
  const form = document.querySelector('#onboarding-form');
  if (!form) return;
  
  const fields = form.querySelectorAll('input, select, textarea');
  fields.forEach(field => {
    if (field.type === 'checkbox' || field.type === 'radio') {
      field.dataset.originalChecked = field.checked;
    } else {
      field.dataset.originalValue = field.value || '';
    }
  });
}

// Initialize step buttons - make globally available
window.initializeStepButtons = function() {
  console.log('Initializing step buttons...');
  
  const stepButtons = document.querySelectorAll('.step-button');
  console.log('Found', stepButtons.length, 'step buttons');
  
  stepButtons.forEach(button => {
    // Remove disabled buttons from consideration
    if (button.disabled) {
      console.log('Button', button.dataset.target, 'is disabled');
      return;
    }
    
    console.log('Attaching click handler to', button.dataset.target);
    
    // Remove any existing listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Add click handler
    newButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const targetStep = this.dataset.target;
      console.log('Button clicked:', targetStep);
      if (targetStep) {
        window.navigateToStep(targetStep);
      }
    });
    
    // Make visually clickable
    newButton.style.cursor = 'pointer';
  });
  
  // Store original form values after buttons are initialized
  setTimeout(storeOriginalFormValues, 500);
};

// Also try to initialize immediately if buttons already exist
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const buttons = document.querySelectorAll('.step-button');
      if (buttons.length > 0) {
        window.initializeStepButtons();
      }
    }, 100);
  });
} else {
  setTimeout(() => {
    const buttons = document.querySelectorAll('.step-button');
    if (buttons.length > 0) {
      window.initializeStepButtons();
    }
  }, 100);
}

console.log('onboarding-header.js loaded');