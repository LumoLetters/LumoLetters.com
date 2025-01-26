//assets/js/components/protected.js

document.addEventListener('DOMContentLoaded', function () {
  const netlifyIdentity = window.netlifyIdentity;
  if (!netlifyIdentity) {
      console.error("Netlify Identity not found!");
      return;
  }
  // Initialize Netlify Identity
  netlifyIdentity.init();
  const currentUser = netlifyIdentity.currentUser();
  checkAuthentication(currentUser)

  netlifyIdentity.on('init', (user) => {
     checkAuthentication(user);
  })
  netlifyIdentity.on('login', (user) => {
      checkAuthentication(user);
  });

  function checkAuthentication(user){
       const currentPath = window.location.pathname.replace(/\/$/, '');
       if(currentPath.includes('/user/') && currentPath !== '/login' && currentPath !== '/user/sign-up'){
          if(!user){
              window.location.assign('/login');
          }
       } else if (currentPath === '/user/sign-up' && user && user.user_metadata?.onboardingComplete){
          window.location.assign('/user/dashboard')
       } else if (currentPath === '/user/sign-up' && !user){
          window.location.assign('/login');
      }else if (currentPath === '/login' && user){
          window.location.assign('/user/dashboard')
       }
   }
  
})