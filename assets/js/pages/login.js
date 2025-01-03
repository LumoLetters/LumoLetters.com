document.addEventListener('DOMContentLoaded', function () {
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const userDisplayName = document.getElementById('userDisplayName');
  const netlifyIdentity = window.netlifyIdentity;
  const signUpButtons = document.querySelectorAll('.trigger-signup'); // Changed to target signup links


  if (!netlifyIdentity) {
    console.error("Netlify Identity not found!");
    return;
  }

  // Initialize Netlify Identity
  netlifyIdentity.init();

  // Check if the user is logged in
  const currentUser = netlifyIdentity.currentUser();
  updateUI(currentUser);  // Update UI immediately based on login state

  // Event Listeners for login and logout buttons
  loginButton.addEventListener('click', () => {
    netlifyIdentity.open(); // Open the Netlify login modal
  });

    signUpButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default link action if any
            netlifyIdentity.open('signup'); // Open the Netlify login modal with the signup tab
        });
    });

  logoutButton.addEventListener('click', () => {
    netlifyIdentity.logout(); // Log the user out
    updateUI(null); // Reset the UI
  });

  // Netlify Identity Event Handlers
  netlifyIdentity.on('login', user => {
    updateUI(user);
    window.location.href = "/user/dashboard"; // Redirect after login
  });

  netlifyIdentity.on('logout', () => {
    updateUI(null);
    window.location.href = '/'; // Redirect to home after logout
  });

  // Function to update UI based on user state
  function updateUI(user) {
    if (user) {
      userDisplayName.textContent = user.user_metadata.full_name;
      logoutButton.classList.remove('hidden');
      loginButton.classList.add('hidden');
      userDisplayName.classList.remove('hidden');
    } else {
      logoutButton.classList.add('hidden');
      loginButton.classList.remove('hidden');
      userDisplayName.classList.add('hidden');
    }
  }
});