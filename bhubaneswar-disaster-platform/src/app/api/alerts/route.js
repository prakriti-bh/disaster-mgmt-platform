import { withErrorHandler, validateRequest, successResponse, ApiError } from '@/utils/apiResponse';
import { alertSchema } from '@/utils/validation';
import { formatNotificationPayload } from '@/utils/notificationService';
import config from '@/utils/config';
import { NextResponse } from 'next/server';
import { generateMockAlert, generateInitialMockData } from '@/utils/mockData';

// Mock alerts data (in production, use a real database)
let alerts = [
  {
    alertId: '1',
    title: 'Heavy Rain Warning',
    description: 'Heavy rainfall expected in the next 24 hours. Please stay indoors.',
    severity: 'warning',
    area: 'Bhubaneswar City',
    source: 'IMD Weather Service',
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    alertId: '2',
    title: 'Flash Flood Alert',
    description: 'Flash flooding reported in low-lying areas. Avoid these regions.',
    severity: 'critical',
    area: 'Mancheswar Industrial Area',
    source: 'City Emergency Services',
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  }
];

// In-memory storage for development
let mockAlerts = generateInitialMockData().alerts;

// Helper function to send notification for a new alert
async function sendAlertNotification(alert) {
  try {
    const payload = formatNotificationPayload('alert', alert);
    const response = await fetch(`${config.app.url}/api/notifications/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    const result = await response.json();
    console.log('Notification broadcast result:', result);
  } catch (error) {
    console.error('Failed to broadcast alert notification:', error);
    // Don't fail the alert creation if notification fails
  }
}

// GET /api/alerts
export async function GET(request) {
  if (process.env.NODE_ENV === 'development') {
    // Filter out expired alerts
    mockAlerts = mockAlerts.filter(alert => new Date(alert.expiresAt) > new Date());
    return NextResponse.json(mockAlerts);
  }

  return withErrorHandler(request, async () => {
    const searchParams = new URL(request.url).searchParams;
    const severity = searchParams.get('severity');
    const area = searchParams.get('area');

    let filteredAlerts = [...alerts];

    // Apply filters if provided
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    if (area) {
      filteredAlerts = filteredAlerts.filter(alert => alert.area.toLowerCase().includes(area.toLowerCase()));
    }

    // Remove expired alerts
    filteredAlerts = filteredAlerts.filter(alert => {
      if (!alert.expiresAt) return true;
      return new Date(alert.expiresAt) > new Date();
    });

    // Sort by severity and timestamp
    filteredAlerts.sort((a, b) => {
      const severityOrder = { emergency: 0, critical: 1, warning: 2, info: 3 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Calculate minimum expiry time from all alerts
    const minExpiryTime = filteredAlerts.reduce((min, alert) => {
      if (!alert.expiresAt) return min;
      const expiryTime = new Date(alert.expiresAt).getTime();
      return min ? Math.min(min, expiryTime) : expiryTime;
    }, null);

    // Set cache control header based on alert expiry
    const response = NextResponse.json(filteredAlerts, { status: 200 });
    if (minExpiryTime) {
      const maxAge = Math.max(0, Math.floor((minExpiryTime - Date.now()) / 1000));
      response.headers.set(
        'Cache-Control',
        `public, max-age=${Math.min(maxAge, 3600)}, stale-while-revalidate=86400`
      );
    } else {
      response.headers.set(
        'Cache-Control',
        'public, max-age=300, stale-while-revalidate=86400'
      );
    }

    return response;
  });
}

// POST /api/alerts (admin only)
export async function POST(request) {
  try {
    const data = await request.json();

    if (process.env.NODE_ENV === 'development') {
      const newAlert = {
        ...generateMockAlert(),
        ...data,
        alertId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };
      mockAlerts.push(newAlert);
      return NextResponse.json(newAlert);
    }

    return withErrorHandler(request, async () => {
      // In production, verify admin role
      validateRequest(data, alertSchema);
      
      const newAlert = {
        alertId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...data
      };
      
      alerts.push(newAlert);

      // Send notification for new alert
      if (config.features.notifications) {
        await sendAlertNotification(newAlert);
      }

      return successResponse(newAlert, 201);
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

// DELETE /api/alerts/:alertId (admin only)
export async function DELETE(request) {
  return withErrorHandler(request, async () => {
    // In production, verify admin role
    const url = new URL(request.url);
    const alertId = url.searchParams.get('alertId');

    if (!alertId) {
      throw new ApiError(400, 'Alert ID is required');
    }

    const alertIndex = alerts.findIndex(a => a.alertId === alertId);
    if (alertIndex === -1) {
      throw new ApiError(404, 'Alert not found');
    }

    alerts.splice(alertIndex, 1);
    return successResponse({ message: 'Alert deleted successfully' });
  });
}