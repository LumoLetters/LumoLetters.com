// main.js
if (window.netlifyIdentity) {
    window.netlifyIdentity.on('init', (user) => {
        if (user) {
            console.log('User is logged in:', user);
        } else {
            console.log('User is not logged in');
            window.location.href = '/login'; // Redirect to login page if not logged in
        }
    });

    window.netlifyIdentity.init();
}