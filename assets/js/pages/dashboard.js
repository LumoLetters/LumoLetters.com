document.addEventListener('DOMContentLoaded', function () {
    const profileForm = document.getElementById('profile-form');
      const profileListElement = document.getElementById('profile-list');
  
  
          // Sample profile test list to be shown initially for those HTML pages in browser
       let userProfiles = [
        { id: 1, name: 'John Doe', location: 'New York, NY', description: 'Loves hiking and enjoys reading books' },
         { id: 2, name: 'Jane Smith', location: 'Los Angeles, CA', description: 'A talented artist who paints beautiful landscapes' },
       { id: 3, name: 'Michael Lee', location: 'Chicago, IL', description: 'Passionate about science and exploring new technologies' }
       ];
  
  
  
       // generates a unique code/key via browser method, so we keep id uniquely using dynamic values.
          const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  
             // generates profile element view html string given a parameter for our HTML views layouts rendering to browser UI (cards/elements on UI from HTML). Those style used classes already are given using template layouts scss from earlier responses with components in css paths
           const createProfileCardElement = (profile) => {
                    const listItem = document.createElement('li');
                 listItem.classList.add('profile-card');
                      listItem.innerHTML = `
                            <h3 class="profile-card-title">${profile.name}</h3>
                            <div class="profile-card-content">
                            <p>Location: ${profile.location}</p>
                            <p>Description: ${profile.description}</p>
                           </div>`;
                       return listItem;
             };
  
  
  
            // Method to call localStorage value during code/page loads (if present on user browsers based history data using browser key based value pair method, with user profiles) to retrieve local data from web history persist and shows again at dashboard on start or refresh
            const loadInitialProfiles = () => {
  
               //Get localstorage value in case it was set or local data are given by each visitor via website session from browser; all the local cached will render in this cycle from page events loads (all those objects values where changed by any save actions we performed in forms)
                  const savedProfiles = localStorage.getItem('lumoProfiles');
                     if(savedProfiles){
                         userProfiles = JSON.parse(savedProfiles);
                  }
  
                 //  Render List to HTML components UI with local store value after check! using similar map iteration function! Then also deletes any default `empty profile list message` html if the user did put user value (as form entries on previous sessions via browser and stored via persistent storage method/API
                       if(userProfiles.length > 0){
                      profileListElement.innerHTML ='';
  
                         userProfiles.forEach(profile => {
                              const card = createProfileCardElement(profile);
                              profileListElement.appendChild(card);
                             });
                           }
             };
  
  
  
  
           // Method is needed to ensure every single update operation/function renders to the  UI HTML
           const updateProfileViews = () => {
  
                      profileListElement.innerHTML = '';
                       userProfiles.forEach(profile => {
                            const card = createProfileCardElement(profile);
                              profileListElement.appendChild(card);
                          });
  
  
                         if(userProfiles.length ==0){
                         profileListElement.innerHTML  ='<p class="dashboard-profiles-container--empty">No profiles added yet.</p>' ;
                    }
  
            };
  
  
  
              // Method for save user data /profiles (using that list variable state in this JS method ) on current open session for all forms/data in this file from memory states (which will then use all html components to re-render UI properly)! . Uses json string method based values to be persisted, from `userProfile` value state array data; this method then use Browser localStorage value setting to browser with json values
             const saveProfilesLocal = () =>{
                       localStorage.setItem('lumoProfiles', JSON.stringify(userProfiles));
              };
  
  
        // This method is our main  Event click triggered when data or user updates html view; gets values from view (text box html id),  updates our javascript lists; calls the UI (profile updates) logic; And calls local-save too! So our memory of states persist after session loads as per data design and code
          window.updateProfileData = function(){
                 const profileNameInput = document.getElementById('profileName').value; //get html using browser document object
                 const profileLocationInput = document.getElementById('profileLocation').value;
              const profileDescriptionInput = document.getElementById('profileDescription').value;
  
  
                // This generated local id  string unique via our method
            const id = generateId();
  
                const newProfile = {
                  id: id,
                      name: profileNameInput,
                    location: profileLocationInput,
                        description: profileDescriptionInput
              };
                 userProfiles.push(newProfile); // Add user object from web based from to update main array in javascript
                 saveProfilesLocal();  // Call memory management
                updateProfileViews();  // Calls logic update html components UI view logic
           };
  
  
        // NETLIFY RELATED  UI logic start (with component access checks / user authentication) , before code (list or html data is rendered and logic starts using Browser UI events); Netlify calls a user based obj that should hold value or undefined/null in non-user based /anonymous page loading on users browser; Using web browser based netlify integrations API code:
       netlifyIdentity.on('init', user =>{
           //check authentication states. If user null / does not have a state we use window methods that uses logic that takes user away from private parts using redirect /route. It can happens after a full logout/login operation for those UI views components or data, (all those steps happens always with valid event flow for component UI /view states); if session auth persists from providers for those user is not nul or undefined we use then load profiles for this auth, otherwise user should first be correctly logged; These if check is our secured method where those actions in codes happens, in all browsers/view load state calls
                   if(!user){
                    window.location.href ="/login.html";  // only non authorized user that does not log via external provider and via API will ever get that, also after full logout with our prior UI setups as described on codes on other layout parts and JS methods to update user auth component states on layout too via visibility; By default our `/user/dashboard.html` renders with proper checks only if they had an auth value at those stage of process;  Since every state uses the browsers cookies to also make UI load fast even on cached web pages, until a full refresh on server that uses also a browsers based component (for both data logic/save + auth logic via third parties methods
                    }  else {   // It implies session state was from a auth-verified logged used
                        loadInitialProfiles();  //  all browser, UI component changes uses also layout style correctly after valid user
                      }
               });
  
  
  
          // Load local based user profile during the start or if any browser local state via memory is stored
         loadInitialProfiles();
  
      });