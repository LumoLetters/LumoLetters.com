document.addEventListener('DOMContentLoaded', function () {
    const logoutButtons = document.querySelectorAll('.logoutButton, #logoutButton, #sidebarLogoutButton');
    const loginButtons = document.querySelectorAll('.loginButton, #loginButton');
    const userDisplayName = document.getElementById('userDisplayName');
    const dashboardIcon = document.getElementById('dashboardIcon');
    const netlifyIdentity = window.netlifyIdentity;
    const siteBaseURL = window.location.origin;

    if (!netlifyIdentity) {
        console.error("Netlify Identity not found!");
        return;
    }

    // Initialize Netlify Identity
    netlifyIdentity.init();

    // Check if the user is logged in
    const currentUser = netlifyIdentity.currentUser();
    updateUI(currentUser);
    checkAndRedirect(currentUser);
    displayMetadata(currentUser);

    // Event Listeners for login buttons
    loginButtons.forEach(button => {
        button.addEventListener('click', () => {
            netlifyIdentity.open();
        });
    });

    // Event Listeners for logout buttons
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            netlifyIdentity.logout();
            updateUI(null);
            closeModal().then(() => {
                window.location.assign('/'); // Redirect to homepage after logout
            });
        });
    });

    // Netlify Identity Event Handlers
    netlifyIdentity.on('init', user => {
        if (user) {
            handleLoginRedirect(user);
        }
    });

    netlifyIdentity.on('login', user => {
        closeModal().then(() => {
            updateUI(user);
            displayMetadata(user);
            handleLoginRedirect(user);
        });
    });

    netlifyIdentity.on('logout', () => {
        updateUI(null);
        closeModal().then(() => {
            window.location.assign('/'); // Redirect to homepage after logout
        });
    });

    // Function to update UI based on user state
    function updateUI(user) {
        if (user) {
            userDisplayName.textContent = user.user_metadata.full_name;
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

    // Function to check if user is logged in and redirect client-side
    function checkAndRedirect(user) {
        const currentPath = window.location.pathname.replace(/\/$/, '');

        console.log("Checking redirection for path:", currentPath);

        if (currentPath === '/login' && user) {
            console.log("User is logged in, redirecting to dashboard");
            window.location.assign('/user/dashboard');
        } else if (currentPath === '/user/dashboard' && !user) {
            console.log("User is not logged in, redirecting to login");
            window.location.assign('/login');
        }
    }

    function handleLoginRedirect(user) {
        if (sessionStorage.getItem("redirectAfterLogin") === "true") {
            sessionStorage.removeItem("redirectAfterLogin");
            window.location.assign("/user/dashboard");
        } else if (!user || !user.user_metadata.onboardingComplete) {
            window.location.assign('/user/sign-up');
        } else {
            window.location.assign('/user/dashboard');
        }
    }

    function displayMetadata(user) {
        if (user) {
            const metadata = user.user_metadata;
            console.log("User Metadata:", metadata);
        }
    }

    // Function to close the Netlify Identity modal
    function closeModal() {
        return new Promise(resolve => {
            netlifyIdentity.close();
            setTimeout(resolve, 50); // Give the modal a bit of time to close
        });
    }
});
