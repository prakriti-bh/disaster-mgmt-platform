import { withErrorHandler, validateRequest, successResponse, ApiError, validateAuthToken } from '@/utils/apiResponse';
import { reportSchema } from '@/utils/validation';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { generateMockReport, generateInitialMockData } from '@/utils/mockData';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// In-memory storage for development
let mockReports = generateInitialMockData().reports;

// Mock reports data (in production, use a real database)
let reports = [
  {
    reportId: '1',
    title: 'Road Blocked in Saheed Nagar',
    type: 'blocked-road',
    description: 'Fallen tree blocking main road near Bank of India branch',
    severity: 3,
    coordinates: {
      latitude: 20.2961,
      longitude: 85.8245
    },
    address: 'Saheed Nagar Main Road',
    userId: '1',
    userName: 'John Doe',
    isAnonymous: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/reports
export async function GET(request) {
  // In development, return mock data
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json(mockReports);
  }

  return withErrorHandler(request, async () => {
    const searchParams = new URL(request.url).searchParams;
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    let filteredReports = [...reports];

    // Apply filters
    if (type) {
      filteredReports = filteredReports.filter(report => report.type === type);
    }
    if (severity) {
      filteredReports = filteredReports.filter(report => report.severity === parseInt(severity));
    }
    if (status) {
      filteredReports = filteredReports.filter(report => report.status === status);
    }
    if (userId) {
      filteredReports = filteredReports.filter(report => report.userId === userId);
    }

    // Sort by severity and timestamp
    filteredReports.sort((a, b) => {
      if (b.severity !== a.severity) {
        return b.severity - a.severity;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return successResponse(filteredReports);
  });
}

// POST /api/reports
export async function POST(request) {
  try {
    const data = await request.json();

    if (process.env.NODE_ENV === 'development') {
      const newReport = {
        ...generateMockReport(),
        ...data,
        reportId: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };
      mockReports.push(newReport);
      return NextResponse.json(newReport);
    }

    return withErrorHandler(request, async () => {
      validateRequest(data, reportSchema);

      let userId = null;
      let userName = 'Anonymous';

      // If not anonymous, validate user token and get user info
      if (!data.isAnonymous) {
        try {
          const token = validateAuthToken(request);
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.userId;
          // In production, fetch user name from database
          userName = 'John Doe';
        } catch (error) {
          throw new ApiError(401, 'Invalid or expired token');
        }
      }

      const newReport = {
        reportId: crypto.randomUUID(),
        ...data,
        userId,
        userName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      reports.push(newReport);
      return successResponse(newReport, 201);
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

// PATCH /api/reports/:reportId
export async function PATCH(request) {
  return withErrorHandler(request, async () => {
    const url = new URL(request.url);
    const reportId = url.searchParams.get('reportId');
    const updates = await request.json();

    if (!reportId) {
      throw new ApiError(400, 'Report ID is required');
    }

    const reportIndex = reports.findIndex(r => r.reportId === reportId);
    if (reportIndex === -1) {
      throw new ApiError(404, 'Report not found');
    }

    // In production, verify user permissions
    const token = validateAuthToken(request);
    const decoded = jwt.verify(token, JWT_SECRET);

    const report = reports[reportIndex];
    if (report.userId !== decoded.userId) {
      throw new ApiError(403, 'Not authorized to update this report');
    }

    // Only allow updating certain fields
    const allowedUpdates = ['description', 'severity', 'status'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    reports[reportIndex] = {
      ...report,
      ...filteredUpdates,
      updatedAt: new Date().toISOString()
    };

    return successResponse(reports[reportIndex]);
  });
}

// DELETE /api/reports/:reportId
export async function DELETE(request) {
  return withErrorHandler(request, async () => {
    const url = new URL(request.url);
    const reportId = url.searchParams.get('reportId');

    if (!reportId) {
      throw new ApiError(400, 'Report ID is required');
    }

    // In production, verify user permissions
    const token = validateAuthToken(request);
    const decoded = jwt.verify(token, JWT_SECRET);

    const reportIndex = reports.findIndex(r => r.reportId === reportId);
    if (reportIndex === -1) {
      throw new ApiError(404, 'Report not found');
    }

    const report = reports[reportIndex];
    if (report.userId !== decoded.userId) {
      throw new ApiError(403, 'Not authorized to delete this report');
    }

    reports.splice(reportIndex, 1);
    return successResponse({ message: 'Report deleted successfully' });
  });
}