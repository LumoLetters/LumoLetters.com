document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('user-profile-form');
  const netlifyIdentity = window.netlifyIdentity;
  const user = netlifyIdentity.currentUser();
  

  async function populateForm(){
      if(!user) return;
     try{
        const response = await fetch('/.netlify/functions/get-user-profile', {
           method: 'POST',
           headers: {
           'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
          });
         const data = await response.json();

       if(data.data){
         const userData = data.data;
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
     } catch(error){
        console.error('Error getting user data', error)
     }

 }
 populateForm();

  form.addEventListener('submit', async function(event) {
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
      
       try{
            const response = await fetch('/.netlify/functions/save-user-profile', {
               method: 'POST',
              headers: {
               'Content-Type': 'application/json',
              },
              body: JSON.stringify({name: userData.name, email: userData.email}),
              });

             const data = await response.json();
              console.log("saved data", data);
            alert("Profile updated.");
         } catch (error){
            console.error("Error saving data:", error)
        }
  });
});