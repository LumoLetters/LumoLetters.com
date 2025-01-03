document.addEventListener('DOMContentLoaded', function () {
  
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const userDisplayName = document.getElementById('userDisplayName');
    const netlifyIdentity = window.netlifyIdentity;
  
    if (!netlifyIdentity) {
      console.error("Netlify Identity not found!");
      return;
    }
  
    // Initialize Netlify Identity
    netlifyIdentity.init();
  
    // Check current user on page load and update UI
    const currentUser = netlifyIdentity.currentUser();
    updateUI(currentUser); // Immediately reflect user state in the UI
  
    // Event Listeners for login and logout buttons
    loginButton.addEventListener('click', () => {
      netlifyIdentity.open(); // Open the Netlify login modal
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
  