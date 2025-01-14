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
    
    let isHandlingRedirect = false;
  
    if (!netlifyIdentity) {
      console.error("Netlify Identity not found!");
      return;
    }
  
    netlifyIdentity.init();
  
    const currentUser = netlifyIdentity.currentUser();
    handlePageChange(currentUser);
  
    loginButtons.forEach(button => {
      button.addEventListener('click', () => {
        netlifyIdentity.open();
      });
    });
  
    signUpButtons.forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        netlifyIdentity.open('signup');
      });
    });
  
    logoutButtons.forEach(button => {
      button.addEventListener('click', () => {
        netlifyIdentity.logout();
        updateUI(null);
      });
    });
  
    netlifyIdentity.on('init', user => {
      if (user) {
        handlePageChange(user);
      } else {
        checkAndRedirect(null);
      }
    });
  
    netlifyIdentity.on('login', user => {
      closeModal().then(() => {
        updateUI(user);
        displayMetadata(user);
        handlePageChange(user);
      });
    });
  
    netlifyIdentity.on('logout', () => {
      updateUI(null);
      checkAndRedirect(null);
    });
  
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
  
    function checkAndRedirect(user) {
      if (isHandlingRedirect) return;
      isHandlingRedirect = true;
  
      if (window.location.pathname.startsWith("/user/") && !user) {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (user && window.location.pathname === '/login') {
        window.location.href = '/user/dashboard';
      }
  
      setTimeout(() => (isHandlingRedirect = false), 100);
    }
  
    function checkOnboarding(user) {
      if (!user || !user.user_metadata.onboardingComplete) {
        if (window.location.pathname !== '/user/sign-up') {
          window.location.href = '/user/sign-up';
        }
      } else if (window.location.pathname !== '/user/dashboard') {
        window.location.href = '/user/dashboard';
      }
    }
  
    function closeModal() {
      return new Promise(resolve => {
        netlifyIdentity.close();
        setTimeout(resolve, 50);
      });
    }
  
    function handlePageChange(user) {
      checkAndRedirect(user);
      displayMetadata(user);
      fetchAndPopulateDashboard(user);
  
      if (interestsPage) {
        fetchAndPopulateInterests(user);
      }
    }
  
    function displayMetadata(user) {
      if (user) {
        console.log("User Metadata:", user.user_metadata);
      }
    }
  
    async function fetchAndPopulateDashboard(user) {
      if (user && window.location.pathname === '/user/dashboard') {
        try {
          const response = await fetch(`/.netlify/functions/get-user-profile?userId=${user.id}`);
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
  
    window.addEventListener('popstate', () => {
      const currentUser = netlifyIdentity.currentUser();
      handlePageChange(currentUser);
    });
  
    window.addEventListener('hashchange', () => {
      const currentUser = netlifyIdentity.currentUser();
      handlePageChange(currentUser);
    });
  });
  