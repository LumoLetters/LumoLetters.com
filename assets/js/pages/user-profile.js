document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('user-profile-form');
    const netlifyIdentity = window.netlifyIdentity;
    const user = netlifyIdentity.currentUser();


    function populateForm(userData){
      if(!userData) return;
      for(const key in userData){
        const input = form.elements[key];

        if(input){
          if(input.type === 'checkbox'){
             if(Array.isArray(userData[key])){
                if(userData[key].includes(input.value)){
                  input.checked = true
               } else{
                  input.checked = false;
                }
            }
          } else{
           input.value = userData[key]
          }
       }
      }
    }


    if (user) {
        if(user.app_metadata && user.app_metadata.data){
          populateForm(user.app_metadata.data);
        } else if(user.user_metadata && user.user_metadata.data){
             populateForm(user.user_metadata.data);
        }
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData.entries());
    
        // Handle saving of checkbox values
       const interests = [];
       document.querySelectorAll('input[name="interests"]:checked').forEach(checkbox => {
        interests.push(checkbox.value);
       });

       const topics = [];
        document.querySelectorAll('input[name="topics"]:checked').forEach(checkbox => {
         topics.push(checkbox.value);
        });

        userData.interests = interests;
        userData.topics = topics;

        console.log("User Data",userData);



        if (user) {
            user.updateUser({
                data: userData
            }).then(() => {
                 alert("Profile updated.");
                console.log('User metadata updated');
                // Optional redirect to another page after update
            }).catch(error => {
               console.error('Error updating user metadata:', error);
            });

        }
    });
});