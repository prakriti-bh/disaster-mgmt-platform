import webPush from 'web-push';

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webPush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL || 'admin@example.com'}`,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(request) {
  try {
    const { subscription, data } = await request.json();
    
    await webPush.sendNotification(
      subscription,
      JSON.stringify(data),
      {
        TTL: 24 * 60 * 60 // 24 hours
      }
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return Response.json(
      { 
        success: false, 
        error: error.message,
        invalid: error.statusCode === 410 
      },
      { status: error.statusCode || 500 }
    );
  }
}