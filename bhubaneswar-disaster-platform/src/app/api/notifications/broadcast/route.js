import { withErrorHandler, validateAuthToken, successResponse, ApiError } from '@/utils/apiResponse';
import webPush from 'web-push';
import { validateRequest } from '@/utils/validation';
import { z } from 'zod';

const broadcastSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.object({
    type: z.enum(['alert', 'report']),
    id: z.string(),
    severity: z.string().optional(),
    url: z.string().optional()
  }),
  icon: z.string().optional(),
  badge: z.string().optional(),
  tag: z.string().optional(),
  actions: z.array(z.object({
    action: z.string(),
    title: z.string()
  })).optional()
});

// In production, get this from a database
const subscriptions = new Map();

export async function POST(request) {
  return withErrorHandler(request, async () => {
    // Verify admin role in production
    validateAuthToken(request);
    
    const data = await request.json();
    validateRequest(data, broadcastSchema);
    
    const results = [];
    const payload = JSON.stringify({
      ...data,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/notification-badge.png'
    });

    // Send to all subscriptions
    for (const [userId, subscription] of subscriptions.entries()) {
      try {
        await webPush.sendNotification(subscription, payload);
        results.push({ userId, success: true });
      } catch (error) {
        console.error(`Failed to send notification to ${userId}:`, error);
        
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          subscriptions.delete(userId);
        }
        
        results.push({ 
          userId, 
          success: false, 
          error: error.message 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return successResponse({
      total: results.length,
      successful: successCount,
      failed: failureCount,
      results
    });
  });
}