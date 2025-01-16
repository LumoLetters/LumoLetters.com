// assets/js/pages/dashboard.js

document.addEventListener('DOMContentLoaded', function () {
    const sidebarLinks = document.querySelectorAll('.sidebar nav a');
    const dashboardContent = document.getElementById('dashboardContent');

    // Function to highlight the active sidebar link
    function setActiveLink(href) {
        sidebarLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === href);
        });
    }

    // Function to dynamically load content
    function loadContent(title, content, path, pushState = true) {
        dashboardContent.innerHTML = `
            <h1>${title}</h1>
            ${content}
        `;

        if (pushState && path) {
            history.pushState({ path }, title, path); // Update browser URL
        }

        setActiveLink(path); // Highlight the correct link
    }

    // Event Listener for sidebar links
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');

            // Load content based on the selected section
            if (href === '/user/dashboard') {
                loadContent(
                    'Welcome to Your Dashboard',
                    `<p>Select an option from the sidebar to get started.</p>`,
                    href
                );
            } else if (href === '/user/account-settings') {
                loadContent(
                    'User Settings',
                    `
                        <p>Modify your profile information below.</p>
                        <form id="settingsForm">
                            <label for="name">Full Name</label>
                            <input type="text" id="name" name="name" value="">

                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" value="">

                            <button type="submit">Save Changes</button>
                        </form>
                    `,
                    href
                );
            } else if (href === '/user/letter-history') {
                loadContent(
                    'Past Letters',
                    `
                        <p>View all the letters we’ve generated for you.</p>
                        <button aria-label="View past letters">
                            <a href="/user/letter-history">View Past Letters</a>
                        </button>
                    `,
                    href
                );
            } else if (href === '/user/interests') {
                loadContent(
                    'Your Interests',
                    `
                        <p>Manage the themes and topics you've selected for letters.</p>
                        <button aria-label="Edit interests">
                            <a href="/user/interests">Edit Interests</a>
                        </button>
                    `,
                    href
                );
            } else if (href === '/user/plan') {
                loadContent(
                    'Plan & Payment',
                    `
                        <p>View or update your subscription plan.</p>
                        <button aria-label="Manage plan">
                            <a href="/user/plan">Manage Plan</a>
                        </button>
                    `,
                    href
                );
            }
        });
    });

    // Handle popstate event to support browser back/forward navigation
    window.addEventListener('popstate', (event) => {
        const path = event.state?.path || '/user/dashboard';

        if (path === '/user/dashboard') {
            loadContent(
                'Welcome to Your Dashboard',
                `<p>Select an option from the sidebar to get started.</p>`,
                path,
                false
            );
        } else if (path === '/user/account-settings') {
            loadContent(
                'User Settings',
                `
                    <p>Modify your profile information below.</p>
                    <form id="settingsForm">
                        <label for="name">Full Name</label>
                        <input type="text" id="name" name="name" value="">

                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" value="">

                        <button type="submit">Save Changes</button>
                    </form>
                `,
                path,
                false
            );
        } else if (path === '/user/letter-history') {
            loadContent(
                'Past Letters',
                `
                    <p>View all the letters we’ve generated for you.</p>
                    <button aria-label="View past letters">
                        <a href="/user/letter-history">View Past Letters</a>
                    </button>
                `,
                path,
                false
            );
        } else if (path === '/user/interests') {
            loadContent(
                'Your Interests',
                `
                    <p>Manage the themes and topics you've selected for letters.</p>
                    <button aria-label="Edit interests">
                        <a href="/user/interests">Edit Interests</a>
                    </button>
                `,
                path,
                false
            );
        } else if (path === '/user/plan') {
            loadContent(
                'Plan & Payment',
                `
                    <p>View or update your subscription plan.</p>
                    <button aria-label="Manage plan">
                        <a href="/user/plan">Manage Plan</a>
                    </button>
                `,
                path,
                false
            );
        }
    });

        let userProfileData = {};
        // Fetch and display user profile data from MongoDB
    const userName = document.getElementById('userName');
    const userInterests = document.getElementById('userInterests');
    const userTopics = document.getElementById('userTopics');
    const userAddress = document.getElementById('userAddress');
    const paymentPlan = document.getElementById('payment-plan')
    const paymentMethod = document.getElementById('payment-method')

    const netlifyIdentity = window.netlifyIdentity;
    const currentUser = netlifyIdentity.currentUser();
    

    if (currentUser) {
      // Construct a URL relative to the current origin for local development
      const url = new URL(`/.netlify/functions/get-user-profile`, window.location.origin);
      url.searchParams.append("userId", currentUser.id);
    
        fetch(url.toString())
        .then(response => {
          if (!response.ok) {
            console.error(`HTTP error!!!!!!! status: ${response.status}`);
              if(response.status === 404){
                  console.log("User data not found")
              }
              return null;
          }
          return response.json();
        })
        .then(data => {
            if (data) { 
                userProfileData = data.data
                if(userName){
                   userName.textContent = userProfileData.name || 'No name available'; 
                }else{
                   console.error('Could not find element with id userName')
                }
                if(userInterests){
                   userInterests.textContent = userProfileData.interests ? userProfileData.interests.join(', ') : 'No interests available';
                }else{
                   console.error('Could not find element with id userInterests')
                }
                 if(userTopics){
                  userTopics.textContent = userProfileData.topics ? userProfileData.topics.join(', ') : 'No topics available';
                }else{
                  console.error('Could not find element with id userTopics')
                }
                 if(userAddress){
                  userAddress.textContent = userProfileData.address || 'No address available';
                }else{
                  console.error('Could not find element with id userAddress')
                }
                 if(paymentPlan){
                   paymentPlan.textContent = userProfileData.paymentPlan || 'No plan selected';
                }else{
                  console.error('Could not find element with id paymentPlan')
                }
                if(paymentMethod){
                   paymentMethod.textContent = userProfileData.paymentMethod || 'No method selected';
                }else{
                 console.error('Could not find element with id paymentMethod')
               }
            } else {
                console.error('User data not found');
            }
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
        });
    } else {
        console.log('User is not logged in');
    }
});