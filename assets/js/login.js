// login.js
// Initialize Netlify Identity Widget
netlifyIdentity.init();

 const loginButton = document.getElementById('loginButton');
 const logoutButton = document.getElementById('logoutButton');
 const userDisplayName = document.getElementById('userDisplayName');

 // Function to show or hide elements based on authentication status
 function updateUI(user) {
   if (user) {
      loginButton.classList.add('hidden');
      logoutButton.classList.remove('hidden');
      userDisplayName.classList.remove('hidden');
      userDisplayName.textContent = `Hello, ${user.user_metadata.full_name || user.email}!`
     } else {
        loginButton.classList.remove('hidden');
        logoutButton.classList.add('hidden');
        userDisplayName.classList.add('hidden')
      }
  }

  // Check for existing user
 netlifyIdentity.on('init', user => {
   updateUI(user);
 });

 netlifyIdentity.on('login', user => {
   updateUI(user);
 });

 netlifyIdentity.on('logout', () => {
   updateUI(null);
 });

loginButton.addEventListener('click', () => {
  netlifyIdentity.open();
})


logoutButton.addEventListener('click', () => {
  netlifyIdentity.logout();
})