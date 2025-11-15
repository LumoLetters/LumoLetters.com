// netlify/functions/stripe-webhooks.mjs

import Stripe from 'stripe';
import { connectToDatabase, User } from './db-connect.mjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// -----------------------------
//  DISCORD NOTIFICATION HELPER
// -----------------------------
async function sendDiscordNotification(user, metadata) {
  try {
    if (!process.env.DISCORD_WEBHOOK_URL) {
      console.warn("⚠️ No DISCORD_WEBHOOK_URL set");
      return;
    }

    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `
🎉 **New Lumo Letters Subscription!**

**User:** ${user.email}
**Plan:** ${metadata.plan}
**Stripe Price:** ${metadata.priceId}

✉️ Time to prepare their first letter!
        `
      })
    });

    console.log("✅ Discord notification sent.");
  } catch (err) {
    console.error("❌ Failed to send Discord notification:", err);
  }
}


// -----------------------------
//  MAIN WEBHOOK HANDLER
// -----------------------------

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

    console.log(`➡️ Processing event: ${stripeEvent.type}`);

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
        console.log(`ℹ️ Unhandled event type: ${stripeEvent.type}`);
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}


// -----------------------------
//  EVENT HANDLERS
// -----------------------------

async function handleCheckoutComplete(event) {
  const session = event.data.object;

  // Only process subscription checkouts
  if (session.mode !== 'subscription') return;

  console.log("🔔 Handling checkout.session.completed");

  // Pull full subscription object from Stripe
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  // Fetch full user
  const user = await User.findOne({ auth0Id: session.metadata.auth0Id });

  if (!user) {
    console.error("❌ User not found for auth0Id:", session.metadata.auth0Id);
    return;
  }

  // Update MongoDB subscription block
  const updatedUser = await User.findOneAndUpdate(
    { auth0Id: session.metadata.auth0Id },
    {
      subscription: {
        status: subscription.status,
        plan: session.metadata.plan,
        priceId: session.metadata.priceId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        startDate: new Date()
      }
    },
    { new: true }
  );

  console.log("✅ Subscription updated in Mongo:", updatedUser.subscription);

  // Send Discord notification
  await sendDiscordNotification(user, session.metadata);
}


async function handleSubscriptionUpdate(event) {
  const subscription = event.data.object;

  console.log("🔄 subscription.updated");

  await User.findOneAndUpdate(
    { 'subscription.stripeSubscriptionId': subscription.id },
    {
      'subscription.status': subscription.status,
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
      'subscription.plan':
        subscription.items.data[0]?.price.nickname ||
        subscription.items.data[0]?.price.id ||
        'unknown'
    }
  );
}


async function handleSubscriptionDeleted(event) {
  const subscription = event.data.object;

  console.log("🗑 subscription.deleted");

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

  console.log("💰 invoice.paid");

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

  console.log("⚠️ invoice.payment_failed");

  await User.findOneAndUpdate(
    { 'subscription.stripeSubscriptionId': invoice.subscription },
    { 'subscription.status': 'past_due' }
  );
}
