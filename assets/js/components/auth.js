document.addEventListener('DOMContentLoaded', function () {
  // Select ALL logout buttons using a common class and the ID for the header button
  const logoutButtons = document.querySelectorAll('.logoutButton, #logoutButton, #sidebarLogoutButton');
  const loginButtons = document.querySelectorAll('.loginButton, #loginButton');
  const userDisplayName = document.getElementById('userDisplayName');
  const dashboardIcon = document.getElementById('dashboardIcon');
  const netlifyIdentity = window.netlifyIdentity;
  const signUpButtons = document.querySelectorAll('.trigger-signup');
  const signupForm = document.getElementById('signup-form');
  const interestsContainer = document.getElementById('interestsContainer');
  const interestsPage = document.querySelector('.interests-page');

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
  fetchAndPopulateDashboard(currentUser);

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
      });
  });

  // Netlify Identity Event Handlers
  netlifyIdentity.on('init', user => {
     if (user) {
        if (localStorage.getItem("submittedForm") === 'true') {
            localStorage.removeItem("submittedForm");
            window.location.replace('/user/dashboard');
        } else {
            checkOnboarding(user);
        }
     }
  });

  netlifyIdentity.on('login', user => {
      closeModal().then(() => {
            updateUI(user);
            displayMetadata(user);
            if (localStorage.getItem("submittedForm") === 'true') {
                localStorage.removeItem("submittedForm");
                window.location.replace('/user/dashboard');
            } else {
                checkOnboarding(user);
            }
      });
  });

  netlifyIdentity.on('logout', () => {
      updateUI(null);
      checkAndRedirect(null);
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
      if (window.location.pathname.startsWith("/user/") && !user) {
          window.location.href = '/login';
      }
      if (!window.location.pathname.startsWith("/user/") && user && window.location.pathname == '/login') {
         window.location.href = '/user/dashboard';
      }
  }

  function closeModal() {
     return new Promise(resolve => {
         netlifyIdentity.close();
         setTimeout(resolve, 50); // Give the modal some time to close (adjust if needed)
     });
  }

  function checkOnboarding(user) {
      if (!user || !user.user_metadata.onboardingComplete) {
           window.location.href = '/user/sign-up';
      } else {
         window.location.href = '/user/dashboard';
     }
  }

  // Handle the form submission
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
                       localStorage.setItem("submittedForm", true);
                       window.location.replace('/user/dashboard');
                  }  else {
                         console.error("No user logged in");
                    }
              } catch (error) {
                  console.error("Error saving user data:", error);
              } finally {
                submitButton.disabled = false; // Re-enable the button after submission
                signupForm.dataset.isSubmitting = false; // Reset the submission flag
            }
         }
      });
 }

  function displayMetadata(user) {
       if (user) {
          const metadata = user.user_metadata;
             console.log("User Metadata:", metadata);
       }
  }

  // Fetches user data from MongoDB and populates the dashboard
  async function fetchAndPopulateDashboard(user) {
      if (user && window.location.pathname === '/user/dashboard') {
          try {
               const response = await fetch(`/.netlify/functions/get-user-profile?userId=${user.id}`);
                const data = await response.json();
                 if (data && data.data) {
                      const userProfile = data.data;
                      // Populate User Name
                       const nameElement = document.getElementById('userName');
                        if (nameElement) {
                            nameElement.textContent = userProfile.name;
                         }
                         // Populate Interests
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
                 } else {
                     console.error("User data not found in MongoDB");
               }
          } catch (error) {
               console.error("Error fetching user profile data:", error);
          }
      }
  }

  // Fetches and populates the interests form when the interests tab is loaded
  async function fetchAndPopulateInterests(user) {
        if (user && window.location.pathname === '/user/interests') {
            try {
              const response = await fetch(`/.netlify/functions/get-user-profile?userId=${user.id}`);
               const data = await response.json();
                if (data && data.data) {
                      const userProfile = data.data;
                      if (userProfile.interests) {
                           for (const interest of userProfile.interests) {
                                const interestInput = document.getElementById(interest);
                                 if (interestInput) {
                                     interestInput.checked = true;
                                 }
                          }
                      }
                  }
            } catch (error) {
                 console.error("Error fetching user profile data for interests page:", error);
            }
       }
  }

  // Call checkAndRedirect whenever a new page is loaded
  window.addEventListener("load", () => {
      const currentUser = netlifyIdentity.currentUser();
      checkAndRedirect(currentUser);
      displayMetadata(currentUser);
      fetchAndPopulateDashboard(currentUser);
      if (interestsPage) {
          fetchAndPopulateInterests(currentUser);
      }

     // Listen for further url changes
    window.addEventListener('popstate', () => {
           const currentUser = netlifyIdentity.currentUser();
           checkAndRedirect(currentUser);
            displayMetadata(currentUser);
           fetchAndPopulateDashboard(currentUser);
             if (interestsPage) {
                   fetchAndPopulateInterests(currentUser);
              }
      });
     window.addEventListener('hashchange', () => {
           const currentUser = netlifyIdentity.currentUser();
           checkAndRedirect(currentUser);
             displayMetadata(currentUser);
            fetchAndPopulateDashboard(currentUser);
               if (interestsPage) {
                   fetchAndPopulateInterests(currentUser);
                }
        });
   });
});


///before gemini
// before new gpt fix 