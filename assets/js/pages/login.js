document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        console.log("Login button found");
        loginButton.addEventListener('click', () => {
            console.log("Login button clicked");
        });
    } else {
        console.error("Login button not found");
    }


    // Initialize Netlify Identity Widget
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', (user) => {
            if (user) {
                updateUIForLoggedInUser(user);
            } else {
                updateUIForLoggedOutUser();
            }
        });

        window.netlifyIdentity.on('login', (user) => {
            updateUIForLoggedInUser(user);
            window.netlifyIdentity.close(); // Close the widget after login
        });

        window.netlifyIdentity.on('logout', () => {
            updateUIForLoggedOutUser();
        });

        window.netlifyIdentity.init();
    } else {
        console.error('Netlify Identity is not available.');
    }

    // Update UI when the user logs in
    function updateUIForLoggedInUser(user) {
        loginButton.classList.add('hidden');
        logoutButton.classList.remove('hidden');
        userDisplayName.textContent = `Hello, ${user.user_metadata.full_name || 'User'}`;
        userDisplayName.classList.remove('hidden');
    }

    // Update UI when the user logs out
    function updateUIForLoggedOutUser() {
        loginButton.classList.remove('hidden');
        logoutButton.classList.add('hidden');
        userDisplayName.textContent = '';
        userDisplayName.classList.add('hidden');
    }

    // Login Button Click
    loginButton.addEventListener('click', () => {
        if (window.netlifyIdentity) {
            window.netlifyIdentity.open();
        } else {
            console.error('Netlify Identity widget is not initialized.');
        }
    });

    // Logout Button Click
    logoutButton.addEventListener('click', () => {
        if (window.netlifyIdentity) {
            window.netlifyIdentity.logout();
        } else {
            console.error('Netlify Identity widget is not initialized.');
        }
    });
});
