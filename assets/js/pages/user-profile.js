document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('user-profile-form');
  const netlifyIdentity = window.netlifyIdentity;

  if (!netlifyIdentity) {
    console.error('Netlify Identity is not initialized.');
    alert('Netlify Identity is required for this page to function.');
    return;
  }

  const user = netlifyIdentity.currentUser();
  console.log('User:', user); // Log the user object to check if the user is logged in

  // Check if the user is logged in
  if (!user) {
    console.log('User is not logged in');
    alert('Please log in to update your profile.');
    return;
  }

  async function populateForm() {
    try {
      console.log('Populating form...'); // Log when form population starts
      const token = await netlifyIdentity.currentUser().jwt();

      const response = await fetch('/.netlify/functions/get-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Include authorization token
        },
      });

      const data = await response.json();
      console.log('Fetched user data:', data); // Log fetched data

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
      // Get JWT from Netlify Identity
      const token = await netlifyIdentity.currentUser().jwt();

      // Send request to the server
      const response = await fetch('/.netlify/functions/save-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
