// assets/js/components/form-handler.js
import { fetchAndPopulateData } from '../pages/dashboard.js'
export async function handleFormSubmission(event) {
    event.preventDefault();
    const form = event.target;
    if(form.id === 'settingsForm'){
        await saveForm(form)
    }else if(form.id === 'interestsForm'){
      await saveInterests(form)
    }else if (form.id === 'topicsForm'){
        await saveTopics(form)
    }
}
async function saveForm(form){
                 const formData = new FormData(form);
                 const formObject = {};
                    formData.forEach((value, key) => {
                        formObject[key] = value;
                    });

                    console.log(formObject);  // Log the form data to ensure it's collected correctly

                    const netlifyIdentity = window.netlifyIdentity;
                    const currentUser = netlifyIdentity.currentUser();
            
                        if (currentUser) {
                               // Send updated user data to Netlify function to save to MongoDB
                                const response = await fetch('/.netlify/functions/save-user-profile', {
                                    method: 'POST',
                                    headers: {
                                    'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                    user_id: currentUser.id,  // Use the current user ID from Netlify Identity
                                    name: formObject.name,
                                    email: formObject.email,
                                    address: {
                                        street: formObject.address,
                                        city: formObject.city,
                                        state: formObject.state,
                                        zip: formObject.zip
                                    },
                                      dob: formObject.dob,
                                       generateLetter: true
                                    })
                                });
                                const data = await response.json();
                                   if(data){
                                        console.log('User data saved:', data);
                                     // No fetchAndPopulate here
                                     return true
                                 }
                                 return false
                            } else {
                            console.error('User is not logged in');
                              return false
                        }
            }
  async function saveInterests(form) {
              const formData = new FormData(form);
             const selectedInterests = [];
                for (const [key, value] of formData.entries()) {
                if (key === "interests") {
                    selectedInterests.push(value);
                }
            }
            const otherInterestText = formData.get('otherInterestText');
             console.log("Selected interests", selectedInterests)
              const netlifyIdentity = window.netlifyIdentity;
                    const currentUser = netlifyIdentity.currentUser();
          if (currentUser) {
               const response = await fetch('/.netlify/functions/save-user-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    interests: selectedInterests,
                     otherInterest: otherInterestText,
                    generateLetter: true
                })
                })
                  const data = await response.json();
                if(data){
                     console.log('User data saved:', data);
                   // No fetchAndPopulate here
                      return true
                 }
                    return false
            } else {
                    console.error('User is not logged in');
                    return false
            }
         }
         async function saveTopics(form){
             const formData = new FormData(form);
                const selectedTopics = [];
                 for (const [key, value] of formData.entries()) {
                  if (key === "topics") {
                      selectedTopics.push(value);
                  }
              }
             const specificTopicText = formData.get('specificTopicText');
             console.log("Selected topics", selectedTopics);
             const netlifyIdentity = window.netlifyIdentity;
             const currentUser = netlifyIdentity.currentUser();
                if (currentUser) {
                   const response = await fetch('/.netlify/functions/save-user-profile', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_id: currentUser.id,
                            topics: selectedTopics,
                            specificTopic: specificTopicText,
                             generateLetter: true
                        })
                    })
                      const data = await response.json();
                       if(data){
                          console.log('User data saved:', data);
                            // No fetchAndPopulate here
                          return true
                       }
                       return false
            } else {
                 console.error('User is not logged in');
                 return false
            }
         }