// login.js
// Initialize Netlify Identity Widget
netlifyIdentity.init();

// Handle Login
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    netlifyIdentity.login({ email, password })
      .then(function(user) {
        window.location.href = "/account.html"; // Redirect to account page after login
      })
      .catch(function(error) {
        console.error("Login failed: ", error);
        alert("Login failed, please try again.");
      });
  });
}
