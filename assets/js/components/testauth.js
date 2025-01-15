document.addEventListener("DOMContentLoaded", () => {
    console.log("Netlify Authentication script loaded");
  
    if (typeof netlifyIdentity !== "undefined") {
      netlifyIdentity.on("init", user => {
        console.log("Netlify Identity initialized", user);
  
        // Call redirection logic once on identity initialization
        redirectIfNecessary(user);
      });
  
      netlifyIdentity.init();
    } else {
      console.error("Netlify Identity is not loaded. Please ensure it is included on the page.");
    }
  });
  
  // Redirect function
  function redirectIfNecessary(user) {
    const currentPath = window.location.pathname;
  
    // Define paths
    const dashboardPath = "/user/dashboard";
    const signupPath = "/sign-up";
  
    if (user) {
      console.log("User is authenticated:", user);
  
      // Redirect to the dashboard if not already there
      if (currentPath !== dashboardPath) {
        console.log(`Redirecting to dashboard: ${dashboardPath}`);
        window.location.replace(dashboardPath);
      }
    } else {
      console.log("User is not authenticated");
  
      // Redirect to sign-up if not already there
      if (currentPath !== signupPath) {
        console.log(`Redirecting to sign-up: ${signupPath}`);
        window.location.replace(signupPath);
      }
    }
  }
  