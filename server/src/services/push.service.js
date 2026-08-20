import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';

// Configure VAPID Details
const vapidEmail = process.env.ADMIN_EMAIL || 'mailto:admin@milkdiary.com';
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  console.log('[Push Service] VAPID details initialized successfully.');
} else {
  console.warn('[Push Service] VAPID keys not configured in environment. Push notifications are disabled.');
}

/**
 * Sends a web push notification payload to all registered subscriptions of a customer.
 * Auto-cleans expired subscriptions (410/404).
 */
export async function sendPushNotification(customerId, payload) {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  try {
    const subscriptions = await PushSubscription.find({ customerId });
    if (subscriptions.length === 0) return;

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
      } catch (error) {
        // Clear expired or deleted browser push tokens
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[Push Service] Removing expired subscription for customer ${customerId}`);
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error(`[Push Service] Failed to send push notification: ${error.message}`);
        }
      }
    });

    await Promise.all(pushPromises);
  } catch (err) {
    console.error(`[Push Service] error: ${err.message}`);
  }
}
