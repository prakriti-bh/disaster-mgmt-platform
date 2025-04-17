import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { errorTracker, ErrorCategory } from './errorTracking';
import rateLimit from './rateLimit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function successResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error) {
  const status = error.status || 500;
  const message = error.message || 'Internal server error';
  const details = error.details || null;

  return NextResponse.json(
    { error: message, details },
    { status }
  );
}

export function validateRequest(data, schema) {
  const validation = schema.safeParse(data);
  if (!validation.success) {
    const details = {};
    validation.error.errors.forEach(err => {
      const path = err.path.join('.');
      details[path] = err.message;
    });

    throw new ApiError(400, 'Validation failed', details);
  }
  return validation.data;
}

export function validateAuthToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization header missing or invalid');
  }

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
}

export async function withErrorHandler(request, handler) {
  const startTime = Date.now();
  const routePath = new URL(request.url).pathname;

  try {
    // Check rate limiting
    if (await rateLimit.isRateLimited(request)) {
      return rateLimit.getRateLimitResponse();
    }

    const response = await handler();
    
    // Track API usage (in development for now)
    if (process.env.NODE_ENV === 'development') {
      console.log(`API ${request.method} ${routePath} - ${Date.now() - startTime}ms`);
    }

    return response;
  } catch (error) {
    // Track the error
    errorTracker.trackApiError(error, routePath, {
      method: request.method,
      duration: Date.now() - startTime,
      query: Object.fromEntries(new URL(request.url).searchParams),
      headers: Object.fromEntries(request.headers),
      ...(error instanceof ApiError ? {
        status: error.status,
        details: error.details
      } : {})
    });

    // Determine error category for specific error types
    let category = ErrorCategory.API;
    if (error.status === 401 || error.status === 403) {
      category = ErrorCategory.AUTH;
    } else if (error.status === 400) {
      category = ErrorCategory.VALIDATION;
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error (${category}):`, error);
    }

    // Return appropriate error response
    return errorResponse(error);
  }
}