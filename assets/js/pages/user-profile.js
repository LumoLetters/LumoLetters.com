document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('user-profile-form');
  const netlifyIdentity = window.netlifyIdentity;
  const user = netlifyIdentity?.currentUser();
  console.log('User:', user);  // Log the user object to check if the user is logged in

  // Check if the user is logged in
  if (!user) {
    console.log('User is not logged in');
    alert('Please log in to update your profile.');
    return;
  }

  async function populateForm() {
    try {
      console.log('Populating form...');  // Log when form population starts
      const response = await fetch('/.netlify/functions/get-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Fetched user data:', data);  // Log fetched data

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
    console.log('Form submit triggered'); // Log when form submission is triggered
    event.preventDefault(); // Prevent the default form submission behavior

    const formData = new FormData(form);
    const userData = Object.fromEntries(formData.entries());
    const otherInterestCheckbox = document.getElementById('interest-other');
    if (otherInterestCheckbox.checked) {
      userData.otherInterests = document.getElementById('other-interests').value;
      console.log('Other Interest:', userData.otherInterests);  // Log other interest data if selected
    }
    
    // Handle checkbox values
    const interests = Array.from(
      document.querySelectorAll('input[name="interests"]:checked')
    ).map((checkbox) => checkbox.value);
    console.log('Selected Interests:', interests);  // Log selected interests

    const topics = Array.from(
      document.querySelectorAll('input[name="topics"]:checked')
    ).map((checkbox) => checkbox.value);
    console.log('Selected Topics:', topics);  // Log selected topics

    userData.interests = interests;
    userData.topics = topics;

    try {
      console.log('Sending data to save-user-profile function:', userData);  // Log userData being sent
      const response = await fetch('/.netlify/functions/save-user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        console.log('Profile update successful');  // Log success message
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
