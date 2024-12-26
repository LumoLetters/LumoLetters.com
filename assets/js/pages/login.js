document.addEventListener('DOMContentLoaded', function () {

  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const userDisplayName = document.getElementById('userDisplayName');

  const netlifyIdentity = window.netlifyIdentity;

  // Initialize Netlify Identity
  netlifyIdentity.init();

  // Event listeners for Netlify Identity
  netlifyIdentity.on('init', (user) => {
    console.log('Netlify Identity initialized:', user);
    updateUI(user);
  });

  netlifyIdentity.on('login', (user) => {
    console.log('User logged in:', user);
    updateUI(user);
    window.location.href = "/user/dashboard.html"; // Redirect after login
  });

  netlifyIdentity.on('logout', () => {
    console.log('User logged out');
    updateUI(null);
    window.location.href = '/login.html'; // Redirect after logout
  });

  // Button Event Listeners
  loginButton.addEventListener('click', () => {
    netlifyIdentity.open();
  });

  logoutButton.addEventListener('click', () => {
    netlifyIdentity.logout();
  });

  // Function to update UI based on user state
  function updateUI(user) {
    if (user) {
      // If a user is logged in
      userDisplayName.textContent = user.user_metadata.full_name || "User";
      logoutButton.classList.remove('hidden');
      loginButton.classList.add('hidden');
      userDisplayName.classList.remove('hidden');
    } else {
      // If no user is logged in
      logoutButton.classList.add('hidden');
      loginButton.classList.remove('hidden');
      userDisplayName.classList.add('hidden');
    }
  }
});
