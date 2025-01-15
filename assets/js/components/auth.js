//assets/js/components/auth.js

document.addEventListener('DOMContentLoaded', function () {
    const logoutButtons = document.querySelectorAll('.logoutButton, #logoutButton, #sidebarLogoutButton');
    const loginButtons = document.querySelectorAll('.loginButton, #loginButton');
    const userDisplayName = document.getElementById('userDisplayName');
    const dashboardIcon = document.getElementById('dashboardIcon');
    const netlifyIdentity = window.netlifyIdentity;

    if (!netlifyIdentity) {
        console.error("Netlify Identity not found!");
        return;
    }

    // Initialize Netlify Identity
    netlifyIdentity.init();

    // Set timeout duration (e.g., 30 minutes)
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
    let inactivityTimer;

    // Check user authentication state
    const currentUser = netlifyIdentity.currentUser();
    updateUI(currentUser);
    checkAndRedirect(currentUser);

    // Event listeners for login and logout
    setupLoginLogout();

    // Start the inactivity timer when the page is loaded
    startInactivityTimer();

    // Netlify Identity Event Handlers
    netlifyIdentity.on('init', user => {
        updateUI(user);
        checkAndRedirect(user);
    });

    netlifyIdentity.on('login', user => {
        updateUI(user);
        handleLoginRedirect(user);
        resetInactivityTimer(); // Reset timer on login
    });

    netlifyIdentity.on('logout', () => {
        updateUI(null);
        resetInactivityTimer(); // Clear timer when logging out
        redirectToHome();
    });

    // Functions

    // Setup login and logout button events
    function setupLoginLogout() {
        loginButtons.forEach(button => {
            button.addEventListener('click', () => netlifyIdentity.open());
        });

        const signUpButtons = document.querySelectorAll('.trigger-signup');
        signUpButtons.forEach(button => {
            button.addEventListener('click', () => netlifyIdentity.open('signup')); // Explicitly trigger the signup flow
        });

        logoutButtons.forEach(button => {
            button.addEventListener('click', () => {
                netlifyIdentity.logout();
                updateUI(null);
                resetInactivityTimer(); // Reset timer on logout
                redirectToHome();
            });
        });
    }

    // Update UI elements based on user state
    function updateUI(user) {
        if (user) {
            userDisplayName.textContent = user.user_metadata.full_name;
            toggleUIElements(true);
        } else {
            toggleUIElements(false);
        }
    }

    // Toggle visibility of UI elements based on user login state
    function toggleUIElements(isLoggedIn) {
        if (isLoggedIn) {
            logoutButtons.forEach(button => button.classList.remove('hidden'));
            loginButtons.forEach(button => button.classList.add('hidden'));
            dashboardIcon.classList.remove('hidden');
            userDisplayName.classList.remove('hidden');
        } else {
            logoutButtons.forEach(button => button.classList.add('hidden'));
            loginButtons.forEach(button => button.classList.remove('hidden'));
            userDisplayName.classList.add('hidden');
            dashboardIcon.classList.add('hidden');
        }
    }

    // Check if the user is logged in and redirect if necessary
    function checkAndRedirect(user) {
        const currentPath = window.location.pathname.replace(/\/$/, '');

        if (currentPath === '/login' && user) {
            window.location.assign('/user/dashboard');
        } else if (currentPath === '/user/dashboard' && !user) {
            window.location.assign('/login');
        }
    }

    // Redirect user after login based on session storage flag
    function handleLoginRedirect(user) {
        // Check if onboarding is complete and redirect accordingly
        if (user && user.user_metadata.onboardingComplete) {
            // Onboarding is complete, redirect to dashboard
            window.location.assign("/user/dashboard");
        } else if (user) {
            // Onboarding not complete, redirect to sign-up page
            window.location.assign('/user/sign-up');
        } else {
            // User not logged in, redirect to login
            window.location.assign('/login');
        }
    }

    // Redirect to homepage after logout
    function redirectToHome() {
        window.location.assign('/');
    }

    // Start the inactivity timer
    function startInactivityTimer() {
        inactivityTimer = setTimeout(() => {
            console.log("User inactive for too long, logging out...");
            netlifyIdentity.logout(); // Automatically log the user out after the timeout
            updateUI(null);
            redirectToHome(); // Redirect to home after logout
        }, INACTIVITY_TIMEOUT);

        document.addEventListener('mousemove', resetInactivityTimer);
        document.addEventListener('keypress', resetInactivityTimer);
    }

    // Reset the inactivity timer
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            console.log("User inactive for too long, logging out...");
            netlifyIdentity.logout(); // Automatically log the user out after the timeout
            updateUI(null);
            redirectToHome();
        }, INACTIVITY_TIMEOUT);
    }
});
