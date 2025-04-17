import config from './config';
import { errorTracker, ErrorCategory } from './errorTracking';

// In-memory subscription store (use database in production)
const subscriptions = new Map();

export async function saveSubscription(userId, subscription) {
  subscriptions.set(userId, subscription);
}

export async function removeSubscription(userId) {
  subscriptions.delete(userId);
}

export async function sendNotification(subscription, data) {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscription, data }),
    });
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to send notification');
    }
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

export async function broadcastNotification(data, filter = () => true) {
  const results = [];
  for (const [userId, subscription] of subscriptions) {
    if (filter(userId)) {
      try {
        const success = await sendNotification(subscription, data);
        results.push({ userId, success });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
  }
  return results;
}

// Format notification payload based on type
export function formatNotificationPayload(type, data) {
  const baseUrl = config.app.url;

  switch (type) {
    case 'alert':
      return {
        title: data.title,
        body: data.description,
        data: {
          type: 'alert',
          id: data.alertId,
          severity: data.severity,
          url: `${baseUrl}/alerts/${data.alertId}`
        },
        icon: '/icons/icon-192x192.png',
        badge: '/icons/notification-badge.png',
        tag: `alert-${data.alertId}`,
        actions: [
          {
            action: 'view',
            title: 'View Details'
          }
        ]
      };

    case 'report':
      return {
        title: 'New Community Report',
        body: data.title,
        data: {
          type: 'report',
          id: data.reportId,
          url: `${baseUrl}/reports/${data.reportId}`
        },
        icon: '/icons/icon-192x192.png',
        badge: '/icons/notification-badge.png',
        tag: `report-${data.reportId}`,
        actions: [
          {
            action: 'view',
            title: 'View Report'
          }
        ]
      };

    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
}

// Check if notifications are supported
export function isNotificationsSupported() {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

// Get current notification permission status
export function getNotificationPermissionStatus() {
  if (!isNotificationsSupported()) return 'unsupported';
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission() {
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (error) {
    errorTracker.track(error, {
      category: ErrorCategory.NOTIFICATION,
      severity: 'warning'
    });
    return false;
  }
}

// Register service worker and push subscription
export async function registerPushSubscription() {
  try {
    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Get push subscription
    let subscription = await registration.pushManager.getSubscription();
    
    // Create new subscription if doesn't exist
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: config.push.publicKey
      });
    }

    return subscription.toJSON();
  } catch (error) {
    errorTracker.track(error, {
      category: ErrorCategory.NOTIFICATION,
      severity: 'error'
    });
    throw new Error('Failed to register push subscription');
  }
}

// Show a notification using the Notifications API directly
export async function showNotification(title, options = {}) {
  if (!isNotificationsSupported()) {
    throw new Error('Notifications not supported');
  }

  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/notification-badge.png',
      ...options
    });
  } catch (error) {
    errorTracker.track(error, {
      category: ErrorCategory.NOTIFICATION,
      severity: 'error',
      metadata: { title, options }
    });
    throw error;
  }
}

// Helper to handle notification clicks
export function handleNotificationClick(event) {
  const { notification, action } = event;
  const data = notification.data;

  // Close the notification
  notification.close();

  // Handle click based on action
  if (action === 'view' && data?.url) {
    // Open the URL in the main window or create a new one if closed
    const windowClient = clients.find(c => c.visibilityState === 'visible');
    if (windowClient) {
      windowClient.navigate(data.url);
      windowClient.focus();
    } else {
      clients.openWindow(data.url);
    }
  }
}

// Helper to encode VAPID public key
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}