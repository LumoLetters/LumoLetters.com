//netlify/functions/subscription.mjs

import Stripe from 'stripe';
import { connectToDatabase, User } from './db-connect.mjs';
import { verifyTokenAndGetSub } from './lib/auth-utils.mjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handler = async (event) => {

  try {

        // DEBUG LOGGING: check if Authorization header exists
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      console.warn('⚠️ No Authorization header found in request');
    } else {
      console.log('✅ Authorization header received, first 20 chars:', authHeader.slice(0, 20));
    }
    
    await connectToDatabase();
    const auth0Sub = await verifyTokenAndGetSub(event);
    const user = await User.findOne({ auth0Id: auth0Sub });

    if (!user) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: 'User not found' }) 
      };
    }

    const pathParts = event.path.split('/');
    const action = pathParts[pathParts.length - 1].toLowerCase();

    if (event.httpMethod === 'GET') {
      return handleGet(action, user);
    } else if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body || '{}');
      return handlePost(action, data, user);
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
  } catch (error) {
    console.error('Subscription handler error:', error);
    const statusCode = error.statusCode || 500;
    return {
      statusCode,
      body: JSON.stringify({ 
        error: error.message || 'An internal server error occurred' 
      })
    };
  }
};

async function handleGet(action, user) {
  switch (action) {
    case 'status':
      return getSubscriptionStatus(user);
    case 'portal':
      return createCustomerPortal(user);
    default:
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Endpoint not found: ${action}` })
      };
  }
}

async function handlePost(action, data, user) {
  switch (action) {
    case 'create-checkout':
      return createCheckoutSession(data, user);
    default:
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Endpoint not found: ${action}` })
      };
  }
}

async function getSubscriptionStatus(user) {
  try {
    if (!user.stripeCustomerId) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: 'no_subscription',
          subscription: null 
        })
      };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'all',
      limit: 1
    });

    const statusMap = {
      active: 'active',
      past_due: 'past_due',
      unpaid: 'unpaid',
      canceled: 'canceled',
      incomplete: 'incomplete',
      incomplete_expired: 'expired',
      trialing: 'trial'
    };

    if (subscriptions.data.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: 'no_subscription',
          subscription: null 
        })
      };
    }

    const subscription = subscriptions.data[0];
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: statusMap[subscription.status] || subscription.status,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          plan: subscription.items.data[0]?.price.nickname || 
                subscription.items.data[0]?.price.id || 
                'unknown'
        }
      })
    };
  } catch (error) {
    console.error('Subscription status error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get subscription status' })
    };
  }
}

async function createCheckoutSession(data, user) {
  try {
    const { priceId, successUrl, cancelUrl } = data;
    
    if (!priceId) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Price ID is required' }) 
      };
    }

    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { auth0Id: user.auth0Id, userId: user._id.toString() },
        address: {
          line1: user.address?.street,
          city: user.address?.city,
          state: user.address?.state,
          postal_code: user.address?.zip,
          country: 'US'
        }
      });
      
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

  const baseUrl = process.env.SITE_URL;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `${baseUrl}/onboarding/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/onboarding/experience`,
      metadata: { auth0Id: user.auth0Id },
      consent_collection: { terms_of_service: 'none' },
      client_reference_id: user._id.toString()
    });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ sessionId: session.id }) 
    };
  } catch (error) {
    console.error('Checkout session error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Failed to create checkout session',
        code: error.code
      }) 
    };
  }
}

async function createCustomerPortal(user) {
  try {
    if (!user.stripeCustomerId) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'No subscription found' }) 
      };
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.SITE_URL}/app/account.html`
    });

    return { 
      statusCode: 200, 
      body: JSON.stringify({ url: portalSession.url }) 
    };
  } catch (error) {
    console.error('Customer portal error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Failed to create billing portal' }) 
    };
  }
}