// assets/js/components/signup-payment.js
import { createStripePaymentMethod, handleSubscription } from './stripe-helper.js'
const stripe = Stripe('YOUR_PUBLISHABLE_KEY'); // Replace with your publishable key
const elements = stripe.elements();
const cardElement = elements.create('card');
const form = document.getElementById('signupForm') // make sure you are using the correct id
const paymentResult = document.getElementById('payment-result')

if(form){
     cardElement.mount('#card-element');

     form.addEventListener('submit', handleSubmit);


  async function handleSubmit(event) {
      event.preventDefault();

     const plan = document.getElementById('paymentPlan').value
     console.log("selected plan", plan)

     const paymentMethod =  await createStripePaymentMethod(stripe, cardElement, paymentResult)

      if(!paymentMethod){
        return;
      }
        const token = await getUserToken();

       await handleSubscription('/.netlify/functions/create-subscription', paymentMethod.id, plan, token, paymentResult)
  }
}