// netlify/functions/stripe-webhooks.mjs

import Stripe from 'stripe';
import { connectToDatabase, User } from './db-connect.mjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  try {
    const sig = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!sig || !webhookSecret) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing signature or secret' })
      };
    }
    
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
      };
    }
    
    await connectToDatabase();
    
    console.log(`Processing event: ${stripeEvent.type}`);
    
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(stripeEvent);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(stripeEvent);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent);
        break;
        
      case 'invoice.paid':
        await handleInvoicePaid(stripeEvent);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(stripeEvent);
        break;
        
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}

async function handleCheckoutComplete(event) {
  const session = event.data.object;
  
  if (session.mode !== 'subscription' || session.payment_status !== 'paid') {
    return;
  }
  
  // Get full subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  await User.findOneAndUpdate(
    { auth0Id: session.metadata.auth0Id },
    {
      'subscription.status': subscription.status,
      'subscription.stripeSubscriptionId': subscription.id,
      'subscription.stripeCustomerId': subscription.customer,
      'subscription.plan': subscription.items.data[0]?.price.nickname || 
                           subscription.items.data[0]?.price.id || 
                           'unknown',
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
    },
    { new: true }
  );
}

async function handleSubscriptionUpdate(event) {
  const subscription = event.data.object;
  
  await User.findOneAndUpdate(
    { 'subscription.stripeSubscriptionId': subscription.id },
    {
      'subscription.status': subscription.status,
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
      'subscription.plan': subscription.items.data[0]?.price.nickname || 
                           subscription.items.data[0]?.price.id || 
                           'unknown'
    }
  );
}

async function handleSubscriptionDeleted(event) {
  const subscription = event.data.object;
  
  await User.findOneAndUpdate(
    { 'subscription.stripeSubscriptionId': subscription.id },
    {
      'subscription.status': 'canceled',
      'subscription.currentPeriodEnd': null
    }
  );
}

async function handleInvoicePaid(event) {
  const invoice = event.data.object;
  
  if (!invoice.subscription) return;
  
  await User.findOneAndUpdate(
    { 'subscription.stripeSubscriptionId': invoice.subscription },
    {
      'subscription.status': 'active',
      'subscription.currentPeriodEnd': new Date(invoice.lines.data[0].period.end * 1000)
    }
  );
}

async function handleInvoicePaymentFailed(event) {
  const invoice = event.data.object;
  
  if (!invoice.subscription) return;
  
  await User.findOneAndUpdate(
    { 'subscription.stripeSubscriptionId': invoice.subscription },
    { 'subscription.status': 'past_due' }
  );
}