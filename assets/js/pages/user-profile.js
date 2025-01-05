//user-profile.js

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('user-profile-form');
  const netlifyIdentity = window.netlifyIdentity;
  const user = netlifyIdentity.currentUser();

  async function populateForm() {
    if (!user) return;
    try {
      const response = await fetch('/.netlify/functions/get-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data.data) {
        const userData = data.data;
        for (const key in userData) {
          const input = form.elements[key];
          if (input) {
            if (input.type === 'checkbox') {
              if (Array.isArray(userData[key])) {
                input.checked = userData[key].includes(input.value);
              }
            } else {
              input.value = userData[key];
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
  }
  populateForm();

  form.addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission
    const formData = new FormData(form);
    const userData = Object.fromEntries(formData.entries());

    // Handle saving of checkbox values
    const interests = [];
    document.querySelectorAll('input[name="interests"]:checked').forEach(checkbox => {
      interests.push(checkbox.value);
    });

    const topics = [];
    document.querySelectorAll('input[name="topics"]:checked').forEach(checkbox => {
      topics.push(checkbox.value);
    });
    userData.interests = interests;
    userData.topics = topics;

    try {
      const response = await fetch('/.netlify/functions/save-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('Saved data:', data);
      alert('Profile updated.');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  });
});