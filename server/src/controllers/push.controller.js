import PushSubscription from '../models/PushSubscription.js';

export async function subscribe(req, res, next) {
  try {
    const { subscription } = req.body;
    
    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.auth || !subscription.keys.p256dh) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid subscription object. Must contain endpoint and keys (auth, p256dh).',
      });
    }

    const customerId = req.customer._id;
    const userAgent = req.headers['user-agent'];

    // Upsert subscription mapped to this specific browser endpoint
    let sub = await PushSubscription.findOne({ 'subscription.endpoint': subscription.endpoint });
    if (!sub) {
      sub = new PushSubscription({
        customerId,
        subscription,
        userAgent,
      });
    } else {
      sub.customerId = customerId;
      sub.subscription = subscription;
      sub.userAgent = userAgent;
    }

    await sub.save();

    return res.status(200).json({
      success: true,
      data: {
        message: 'Subscribed to push notifications successfully.',
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function unsubscribe(req, res, next) {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Subscription endpoint is required to unsubscribe.',
      });
    }

    const customerId = req.customer._id;

    // Delete the subscription matching endpoint and customer context
    await PushSubscription.deleteOne({
      'subscription.endpoint': endpoint,
      customerId,
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Unsubscribed from push notifications successfully.',
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
}
