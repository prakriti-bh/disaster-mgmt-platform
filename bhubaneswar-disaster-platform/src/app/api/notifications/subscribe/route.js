import { withErrorHandler, validateAuthToken, successResponse, ApiError } from '@/utils/apiResponse';
import webPush from 'web-push';

// Initialize web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webPush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL || 'admin@example.com'}`,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// In-memory subscription store (use database in production)
const subscriptions = new Map();

export async function POST(request) {
  return withErrorHandler(request, async () => {
    const token = validateAuthToken(request);
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      throw new ApiError(400, 'Invalid subscription data');
    }

    // Store subscription with user ID
    // In production, save to database
    subscriptions.set(token.userId, subscription);

    // Send a test notification
    try {
      await webPush.sendNotification(
        subscription,
        JSON.stringify({
          title: 'Notifications Enabled',
          body: 'You will now receive alerts and important updates.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/notification-badge.png'
        })
      );
    } catch (error) {
      console.error('Failed to send test notification:', error);
      // Don't fail the subscription if test notification fails
    }

    return successResponse({ 
      message: 'Subscription successful',
      subscriptionId: token.userId
    });
  });
}

export async function DELETE(request) {
  return withErrorHandler(request, async () => {
    const token = validateAuthToken(request);
    
    // Remove subscription
    // In production, remove from database
    subscriptions.delete(token.userId);

    return successResponse({ 
      message: 'Unsubscribed successfully' 
    });
  });
}