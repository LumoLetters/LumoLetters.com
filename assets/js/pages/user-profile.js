document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('user-profile-form');
  const netlifyIdentity = window.netlifyIdentity;
  const user = netlifyIdentity?.currentUser();

  // Check if the user is logged in
  if (!user) {
    alert('Please log in to update your profile.');
    return;
  }

  async function populateForm() {
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

        // Populate the form fields
        for (const key in userData) {
          const input = form.elements[key];
          if (input) {
            if (input.type === 'checkbox') {
              input.checked = Array.isArray(userData[key]) && userData[key].includes(input.value);
            } else {
              input.value = userData[key];
            }
          }
        }
      }
    } catch (error) {
      console.error('Error populating form:', error);
    }
  }

  populateForm();

  form.addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const formData = new FormData(form);
    const userData = Object.fromEntries(formData.entries());

    // Handle checkbox values
    const interests = Array.from(
      document.querySelectorAll('input[name="interests"]:checked')
    ).map((checkbox) => checkbox.value);

    const topics = Array.from(
      document.querySelectorAll('input[name="topics"]:checked')
    ).map((checkbox) => checkbox.value);

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

      if (response.ok) {
        alert('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Error saving data:', errorData);
        alert('There was an issue updating your profile.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving your profile. Please try again later.');
    }
  });
});
