document.addEventListener('DOMContentLoaded', function () {
    const logoutButtons = document.querySelectorAll('.logoutButton, #logoutButton, #sidebarLogoutButton');
    const loginButtons = document.querySelectorAll('.loginButton, #loginButton');
    const userDisplayName = document.getElementById('userDisplayName');
    const dashboardIcon = document.getElementById('dashboardIcon');
    const netlifyIdentity = window.netlifyIdentity;
    const signUpButtons = document.querySelectorAll('.trigger-signup');
    const signupForm = document.getElementById('signup-form');
    const interestsContainer = document.getElementById('interestsContainer');
    const interestsPage = document.querySelector('.interests-page');
    const siteBaseURL = window.location.origin;

    if (!netlifyIdentity) {
        console.error("Netlify Identity not found!");
        return;
    }

    // Initialize Netlify Identity
    netlifyIdentity.init();

    // Check the initial login state
    const currentUser = netlifyIdentity.currentUser();
    updateUI(currentUser);
    checkAndRedirect(currentUser);

    // Event Listeners for login buttons
    loginButtons.forEach(button => {
        button.addEventListener('click', () => {
            netlifyIdentity.open();
        });
    });

    signUpButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            netlifyIdentity.open('signup');
        });
    });

    // Event Listeners for logout buttons
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            netlifyIdentity.logout();
            updateUI(null);
            sessionStorage.removeItem("redirected"); // Reset redirected flag on logout
        });
    });

    // Netlify Identity Event Handlers
    netlifyIdentity.on('login', user => {
        updateUI(user);
        sessionStorage.setItem("redirected", "true"); // Set redirected flag after login
        handleLoginRedirect(user);
    });

    netlifyIdentity.on('logout', () => {
        updateUI(null);
        sessionStorage.removeItem("redirected"); // Reset redirected flag on logout
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
        const currentPath = window.location.pathname;
        const redirected = sessionStorage.getItem("redirected");

        // Avoid redirect if already redirected
        if (redirected) {
            return;
        }

        // If user is logged in and on the login page, redirect to dashboard
        if (user && currentPath === "/login") {
            window.location.assign('/user/dashboard');
        }
        // If user is not logged in and tries to access dashboard, redirect to login
        else if (!user && currentPath === "/user/dashboard") {
            window.location.assign('/login');
        }
    }

    // Function to handle login redirects
    function handleLoginRedirect(user) {
        const redirected = sessionStorage.getItem("redirected");

        // Redirect only if not redirected already
        if (!redirected) {
            sessionStorage.setItem("redirected", "true");
            if (user && user.user_metadata.onboardingComplete) {
                window.location.assign('/user/dashboard');
            } else {
                window.location.assign('/user/sign-up');
            }
        }
    }

    // Handle the form submission for signup
    if (signupForm && !signupForm.dataset.listenerAdded) {
        signupForm.dataset.listenerAdded = true; // Mark as initialized
        signupForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const submitButton = signupForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            if (!signupForm.dataset.isSubmitting) {
                signupForm.dataset.isSubmitting = true;
                try {
                    const formData = new FormData(signupForm);
                    const formObject = {};
                    formData.forEach((value, key) => {
                        if (formObject[key]) {
                            if (!Array.isArray(formObject[key])) {
                                formObject[key] = [formObject[key]];
                            }
                            formObject[key].push(value);
                        } else {
                            formObject[key] = value;
                        }
                    });

                    const user = netlifyIdentity.gotrue.currentUser();
                    if (user) {
                        await user.update({
                            data: {
                                name: formObject.name,
                                onboardingComplete: true,
                            },
                        });
                        const response = await fetch('/.netlify/functions/save-user-profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...formObject,
                                user_id: user.id,
                            }),
                        });
                        const data = await response.json();
                        console.log("User data saved:", data);
                        sessionStorage.setItem("redirectAfterLogin", "true");
                        handleLoginRedirect(user);
                    } else {
                        console.error("No user logged in");
                    }
                } catch (error) {
                    console.error("Error saving user data:", error);
                } finally {
                    submitButton.disabled = false;
                    signupForm.dataset.isSubmitting = false;
                }
            }
        });
    }

    // Fetch and populate user data on the dashboard
    async function fetchAndPopulateDashboard(user) {
        if (user && window.location.pathname === '/user/dashboard') {
            try {
                const response = await fetch(`${siteBaseURL}/.netlify/functions/get-user-profile?userId=${user.id}`);
                const data = await response.json();
                if (data && data.data) {
                    const userProfile = data.data;
                    const nameElement = document.getElementById('userName');
                    if (nameElement) {
                        nameElement.textContent = userProfile.name;
                    }
                    if (interestsContainer) {
                        interestsContainer.innerHTML = '';
                        if (userProfile.interests) {
                            for (const interest of userProfile.interests) {
                                const p = document.createElement('p');
                                p.textContent = interest;
                                interestsContainer.appendChild(p);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching user profile data:", error);
            }
        }
    }

    // Call fetchDataOnPageLoad whenever a new page is loaded
    window.addEventListener("load", () => {
        const currentUser = netlifyIdentity.currentUser();
        checkAndRedirect(currentUser);
        fetchAndPopulateDashboard(currentUser);
    });
});
