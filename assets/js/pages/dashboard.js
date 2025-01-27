import { handleFormSubmission } from '../components/form-handler.js';

// Helper function to get user token
async function getUserToken() {
  const netlifyIdentity = window.netlifyIdentity;
  const currentUser = netlifyIdentity.currentUser();
  if (currentUser) {
      return currentUser.token.access_token;
  }
  return null;
}
export async function fetchAndPopulateData() {
    const token = await getUserToken();
    const netlifyIdentity = window.netlifyIdentity;
    const currentUser = netlifyIdentity.currentUser();
  let userData = {};
  console.log("currentUser", currentUser);
    if (currentUser && token) {
        
      // Construct a URL relative to the current origin for local development
      const url = new URL(`/.netlify/functions/get-user-profile`, window.location.origin);
      url.searchParams.append("userId", currentUser.id);
      try {
        const response = await fetch(url.toString(),{
          method: 'GET',
          headers:{
               'Authorization': `Bearer ${token}`
            }
          });
        if (!response.ok) {
          console.error(`HTTP error!!!!!!! status: ${response.status}`);
          if (response.status === 404) {
            console.log("User data not found")
          }
          return;
        }
        const data = await response.json();
        if (data && data.data) {
           userData = data.data;
          console.log("userProfileData", userData);
        } else {
          console.error('User data not found');
        }

      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    } else {
      console.log('User is not logged in');
    }
  return userData;
  }
document.addEventListener('DOMContentLoaded', async function () {
    const sidebarLinks = document.querySelectorAll('.sidebar nav a');
    const dashboardContent = document.getElementById('dashboardContent');
    let userProfileData = {}; // Store your data here
     let userLetters = [];
    // Function to highlight the active sidebar link
    function setActiveLink(href) {
        sidebarLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === href);
        });
    }

    // Function to dynamically load content
    async function loadContent(title, content, path, pushState = true) {
           console.log("userProfileData", userProfileData)
      let userDataHTML = ``;
       if(path === '/user/dashboard'){

          userDataHTML =`
                <div>
                 <p>Name: ${userProfileData.name || 'No name available'}</p>
                 <p>Interests: ${userProfileData.interests ? userProfileData.interests.join(', ') : 'No interests available'}</p>
                 <p>Topics: ${userProfileData.topics ? userProfileData.topics.join(', ') : 'No topics available'}</p>
                 <p>Address: ${userProfileData.address?.street || 'No address available'}, ${userProfileData.address?.city || ''}, ${userProfileData.address?.state || ''} ${userProfileData.address?.zip || ''}</p>
                 <p>Payment-Plan: ${userProfileData.paymentPlan || 'No plan selected'}</p>
                  <p>Payment-Method: ${userProfileData.paymentMethod || 'No method selected'}</p>
             </div>
         `
       }
    dashboardContent.innerHTML = `
            <h1>${title}</h1>
            <div class="form-container">
            ${content}
             </div>
            ${userDataHTML}
        `;

        if (pushState && path) {
            history.pushState({ path }, title, path); // Update browser URL
        }

        setActiveLink(path); // Highlight the correct link
    }

  async function fetchUserLetters() {
    const token = await getUserToken();
    const netlifyIdentity = window.netlifyIdentity;
    const currentUser = netlifyIdentity.currentUser();

    if (currentUser && token) {
       console.log("Token being sent with letter request", token);
        // Construct a URL relative to the current origin for local development
      const url = new URL(`/.netlify/functions/get-user-letters`, window.location.origin);
          url.searchParams.append("userId", currentUser.id);
      try {
          const response = await fetch(url.toString(),{
           method: 'GET',
           headers:{
               'Authorization': `Bearer ${token}`
                }
            });
        if (!response.ok) {
          console.error(`HTTP error!!!!!!! status: ${response.status}`);
          if (response.status === 404) {
            console.log("User letters not found")
          }
          return;
        }
        const data = await response.json();
          if (data && data.data) {
              userLetters = data.data;
                console.log("userLetters", userLetters);
          }else{
              console.error('User letters not found');
          }
      } catch (error) {
          console.error('Error fetching user letters:', error);
      }
    } else {
        console.log('User is not logged in');
    }
}

  // Event Listener for sidebar links
  sidebarLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      let content = ``;
      // Load content based on the selected section
      if (href === '/user/dashboard') {
          content = `
                        <p>Select an option from the sidebar to get started.</p>
                    `
        await loadContent('Welcome, ' + (userProfileData.name || 'User') + '!', content, href);
      } else if (href === '/user/account-settings') {
         content = `
                        <p>Modify your profile information below.</p>
                        <form id="settingsForm">
                            <label for="name">Full Name</label>
                            <input type="text" id="name" name="name" value="${userProfileData.name || ''}">

                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" value="${userProfileData.email || ''}">

                           <label for="dob">Date of Birth</label>
                            <input type="text" id="dob" name="dob" value="${userProfileData.dob || ''}">

                            <label for="address">Address</label>
                             <input type="text" id="address" name="address" value="${userProfileData.address?.street || ''}">
                              <input type="text" id="city" name="city" value="${userProfileData.address?.city || ''}">
                             <input type="text" id="state" name="state" value="${userProfileData.address?.state || ''}">
                             <input type="text" id="zip" name="zip" value="${userProfileData.address?.zip || ''}">

                            <button type="submit">Save Changes</button>
                        </form>
                    `;
        await loadContent('User Settings', content, href);
      } else if (href === '/user/letter-history') {
         await fetchUserLetters()
          const letterList = userLetters.map(letter => {
            return `
               <div>
                 <p>${letter.sent_at}</p>
                 <p>from: ${letter.sender_id}</p>
                <p>to: ${letter.receiver_id}</p>
                <p>${letter.content}</p>
               </div>
             `
           }).join('')
        content = `
                        <p>View all the letters we’ve generated for you.</p>
                        ${letterList}
                    `;
        await loadContent('Past Letters', content, href);
      } else if (href === '/user/interests') {
          const allInterests = ["Reading", "Travel", "Music/Film/Theater", "Arts/Crafts", "Sports", "History", "Food/Cooking", "Nature/Outdoors", "Gardening", "Puzzles & Games", "Writing", "Dancing", "Photography", "Collecting", "Volunteering", "Astronomy", "Religious Activities", "Technology", "Animals/Pets", "Current Events", "Health & Wellness", "Family", "Other"];
                const interestCheckboxes = allInterests.map(interest => {
                    const isChecked = userProfileData.interests?.includes(interest) ? 'checked' : '';
                    return `
                        <div class="checkbox-item">
                            <input type="checkbox" id="${interest}" name="interests" value="${interest}" ${isChecked}>
                            <label for="${interest}">${interest}</label>
                        </div>
                    `;
                }).join('');
                 content = `
                        <p>Manage the themes and topics you've selected for letters.</p>
                        <form id="interestsForm">
                            <div class="checkbox-group">
                          ${interestCheckboxes}
                            </div>
                            <div id="otherInterestInput" style="display: ${userProfileData.interests?.includes('Other') ? 'block' : 'none'}">
                            <label for="otherInterestText">Other Interest:</label>
                             <input type="text" id="otherInterestText" name="otherInterestText" value="${userProfileData.otherInterest || ''}">
                             </div>
                          <button type="submit">Save Interests</button>
                         </form>
                    `;
         await loadContent('Your Interests', content, href);
      } else if (href === '/user/topics') {
         const allTopics = ["General Conversation", "Memories and Reminiscing on the Past", "Current Events", "Hobbies/Interests", "Inspirational/Motivational", "Humor/Lighthearted", "Gratitude", "Family Stories", "Travel Adventures", "Personal Accomplishments", "Life Lessons", "Friendly Check-in", "Historical Facts", "Science & Nature", "Book/Movie Reviews", "Local Culture", "Tips and Tricks", "Fictional Stories", "Poetry & Rhymes", "Descriptive Letters", "Art and Creativity", "Word Games/Riddles", "Specific Theme/Topic"];
                const topicCheckboxes = allTopics.map(topic => {
                    const isChecked = userProfileData.topics?.includes(topic) ? 'checked' : '';
                    return `
                        <div class="checkbox-item">
                            <input type="checkbox" id="${topic.replace(/ /g, '_')}" name="topics" value="${topic}" ${isChecked}>
                            <label for="${topic.replace(/ /g, '_')}">${topic}</label>
                        </div>
                    `;
                }).join('');
                  content = `
                        <p>Manage the themes and topics you've selected for letters.</p>
                        <form id="topicsForm">
                            <div class="checkbox-group">
                          ${topicCheckboxes}
                            </div>
                             <div id="specificTopicInput" style="display: ${userProfileData.topics?.includes('Specific Theme/Topic') ? 'block' : 'none'}">
                            <label for="specificTopicText">Specific Theme/Topic:</label>
                             <input type="text" id="specificTopicText" name="specificTopicText" value="${userProfileData.specificTopic || ''}">
                             </div>
                          <button type="submit">Save Topics</button>
                         </form>
                    `;
          await loadContent('Your Topics', content, href);
      } else if (href === '/user/plan') {
        content = `
                        <p>View or update your subscription plan.</p>
                        <button aria-label="Manage plan">
                            <a href="/user/plan">Manage Plan</a>
                        </button>
                    `;
        await loadContent('Plan & Payment', content, href);
      }
    });
  });

  // Handle popstate event to support browser back/forward navigation
  window.addEventListener('popstate', async (event) => {
    const path = event.state?.path || '/user/dashboard';
    let content = ``;
    if (path === '/user/dashboard') {

         content = `
                       <p>Select an option from the sidebar to get started.</p>
                         <div>
                           <p>Name: ${userProfileData.name || 'No name available'}</p>
                           <p>Interests: ${userProfileData.interests ? userProfileData.interests.join(', ') : 'No interests available'}</p>
                           <p>Topics: ${userProfileData.topics ? userProfileData.topics.join(', ') : 'No topics available'}</p>
                            <p>Address: ${userProfileData.address?.street || 'No address available'}, ${userProfileData.address?.city || ''}, ${userProfileData.address?.state || ''} ${userProfileData.address?.zip || ''}</p>
                            <p>Payment-Plan: ${userProfileData.paymentPlan || 'No plan selected'}</p>
                            <p>Payment-Method: ${userProfileData.paymentMethod || 'No method selected'}</p>
                         </div>
                        `
        await loadContent('Welcome, ' + (userProfileData.name || 'User') + '!', content, path, false);
    } else if (path === '/user/account-settings') {
          content = `
                        <p>Modify your profile information below.</p>
                        <form id="settingsForm">
                            <label for="name">Full Name</label>
                            <input type="text" id="name" name="name" value="${userProfileData.name || ''}">

                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" value="${userProfileData.email || ''}">
                              <label for="dob">Date of Birth</label>
                            <input type="text" id="dob" name="dob" value="${userProfileData.dob || ''}">

                            <label for="address">Address</label>
                             <input type="text" id="address" name="address" value="${userProfileData.address?.street || ''}">
                              <input type="text" id="city" name="city" value="${userProfileData.address?.city || ''}">
                             <input type="text" id="state" name="state" value="${userProfileData.address?.state || ''}">
                               <input type="text" id="zip" name="zip" value="${userProfileData.address?.zip || ''}">

                            <button type="submit">Save Changes</button>
                        </form>
                    `;
      await loadContent('User Settings', content, path, false);
    } else if (path === '/user/letter-history') {
        await fetchUserLetters()
         const letterList = userLetters.map(letter => {
            return `
               <div>
                 <p>${letter.sent_at}</p>
                 <p>from: ${letter.sender_id}</p>
                <p>to: ${letter.receiver_id}</p>
                <p>${letter.content}</p>
               </div>
             `
           }).join('')
          content = `
                        <p>View all the letters we’ve generated for you.</p>
                        ${letterList}
                    `;
      await loadContent('Past Letters', content, path, false);
    } else if (path === '/user/interests') {
          const allInterests = ["Reading", "Travel", "Music/Film/Theater", "Arts/Crafts", "Sports", "History", "Food/Cooking", "Nature/Outdoors", "Gardening", "Puzzles & Games", "Writing", "Dancing", "Photography", "Collecting", "Volunteering", "Astronomy", "Religious Activities", "Technology", "Animals/Pets", "Current Events", "Health & Wellness", "Family", "Other"];
                const interestCheckboxes = allInterests.map(interest => {
                    const isChecked = userProfileData.interests?.includes(interest) ? 'checked' : '';
                    return `
                       <div class="checkbox-item">
                            <input type="checkbox" id="${interest}" name="interests" value="${interest}" ${isChecked}>
                            <label for="${interest}">${interest}</label>
                        </div>
                    `;
                }).join('');
                 content = `
                        <p>Manage the themes and topics you've selected for letters.</p>
                        <form id="interestsForm">
                            <div class="checkbox-group">
                          ${interestCheckboxes}
                            </div>
                           <div id="otherInterestInput" style="display: ${userProfileData.interests?.includes('Other') ? 'block' : 'none'}">
                            <label for="otherInterestText">Other Interest:</label>
                             <input type="text" id="otherInterestText" name="otherInterestText" value="${userProfileData.otherInterest || ''}">
                             </div>
                          <button type="submit">Save Interests</button>
                         </form>
                    `;
      await loadContent('Your Interests', content, path, false);
    }  else if (path === '/user/topics') {
        const allTopics = ["General Conversation", "Memories and Reminiscing on the Past", "Current Events", "Hobbies/Interests", "Inspirational/Motivational", "Humor/Lighthearted", "Gratitude", "Family Stories", "Travel Adventures", "Personal Accomplishments", "Life Lessons", "Friendly Check-in", "Historical Facts", "Science & Nature", "Book/Movie Reviews", "Local Culture", "Tips and Tricks", "Fictional Stories", "Poetry & Rhymes", "Descriptive Letters", "Art and Creativity", "Word Games/Riddles", "Specific Theme/Topic"];
                const topicCheckboxes = allTopics.map(topic => {
                    const isChecked = userProfileData.topics?.includes(topic) ? 'checked' : '';
                    return `
                        <div class="checkbox-item">
                            <input type="checkbox" id="${topic.replace(/ /g, '_')}" name="topics" value="${topic}" ${isChecked}>
                            <label for="${topic.replace(/ /g, '_')}">${topic}</label>
                        </div>
                    `;
                }).join('');
                  content = `
                        <p>Manage the themes and topics you've selected for letters.</p>
                        <form id="topicsForm">
                            <div class="checkbox-group">
                          ${topicCheckboxes}
                            </div>
                               <div id="specificTopicInput" style="display: ${userProfileData.topics?.includes('Specific Theme/Topic') ? 'block' : 'none'}">
                            <label for="specificTopicText">Specific Theme/Topic:</label>
                             <input type="text" id="specificTopicText" name="specificTopicText" value="${userProfileData.specificTopic || ''}">
                             </div>
                          <button type="submit">Save Topics</button>
                         </form>
                    `;
      await loadContent('Your Topics', content, path, false);
    }else if (path === '/user/plan') {
        content = `
                        <p>View or update your subscription plan.</p>
                        <button aria-label="Manage plan">
                            <a href="/user/plan">Manage Plan</a>
                        </button>
                    `;
      await loadContent('Plan & Payment', content, path, false);
    }
  });
    document.addEventListener('change', function (event) {
        if (event.target.name === 'interests') {
            const otherInterestInput = document.getElementById('otherInterestInput');
            if(event.target.value === 'Other'){
                otherInterestInput.style.display = event.target.checked ? 'block' : 'none';
            }
        }else if(event.target.name === 'topics'){
          const specificTopicInput = document.getElementById('specificTopicInput');
          if(event.target.value === 'Specific Theme/Topic'){
                specificTopicInput.style.display = event.target.checked ? 'block' : 'none';
            }
        }
    });
     document.addEventListener('submit', async function (event){
            await handleFormSubmission(event)
            const userData = await fetchAndPopulateData();
              userProfileData = userData
               loadContent('Welcome, ' + (userProfileData.name || 'User') + '!', ` <p>Select an option from the sidebar to get started.</p>`, '/user/dashboard');
        });
    async function initializeDashboard(){
          const userData = await fetchAndPopulateData()
          userProfileData = userData
     loadContent('Welcome, ' + (userProfileData.name || 'User') + '!', ` <p>Select an option from the sidebar to get started.</p>`, '/user/dashboard');
    }
      initializeDashboard()
});