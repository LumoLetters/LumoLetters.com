//assets/js/components/stripe-helper.js

// stripe-helper.js
export async function createStripePaymentMethod(stripe, cardElement, paymentResult) {
    const { paymentMethod, error } = await stripe.createPaymentMethod({
         type: 'card',
         card: cardElement,
       });

      if (error) {
        console.error("Error creating payment method", error)
          paymentResult.classList.add("error");
         paymentResult.innerHTML = `Error: ${error.message}`;
         return null;
       }
        return paymentMethod
}

export async function handleSubscription(fetchURL, paymentMethodId, plan, token, paymentResult) {
const response = await fetch(fetchURL, {
          method: 'POST',
           headers: {
              'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
           },
        body: JSON.stringify({
          paymentMethodId: paymentMethodId,
            plan
        }),
      });
const data = await response.json();
 if(response.ok){
      paymentResult.classList.add("success");
       paymentResult.innerHTML = `Success!`;
      console.log('Payment successful!', data);
         return data;
      // Update UI to reflect successful payment
 }else{
        console.error("error creating sub", data)
     paymentResult.classList.add("error");
       paymentResult.innerHTML = `Error: ${data.message}`;
     return null;
 }

}