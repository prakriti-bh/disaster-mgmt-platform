import { NextResponse } from 'next/server';
import config from './config';

class RateLimiter {
  constructor() {
    // In-memory store (use Redis in production)
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  getKey(request) {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') ||
               'unknown';

    // Get route path
    const path = new URL(request.url).pathname;

    // Different limits for different routes
    const routeType = path.startsWith('/api/auth') ? 'auth' :
                     path.startsWith('/api/reports') ? 'reports' :
                     path.startsWith('/api/alerts') ? 'alerts' :
                     'default';

    return `${routeType}:${ip}`;
  }

  getRouteConfig(routeType) {
    // Rate limits per route type (requests per window)
    const limits = {
      auth: 20,      // 20 requests per window for auth endpoints
      reports: 50,   // 50 requests per window for report endpoints
      alerts: 100,   // 100 requests per window for alert endpoints
      default: 200   // 200 requests per window for other endpoints
    };

    return {
      windowMs: config.rateLimit.windowMs,
      max: limits[routeType] || limits.default
    };
  }

  async isRateLimited(request) {
    const key = this.getKey(request);
    const routeType = key.split(':')[0];
    const { windowMs, max } = this.getRouteConfig(routeType);
    const now = Date.now();

    // Get current window data
    let windowData = this.store.get(key) || {
      start: now,
      count: 0
    };

    // Reset if window has expired
    if (now - windowData.start > windowMs) {
      windowData = {
        start: now,
        count: 0
      };
    }

    // Increment counter
    windowData.count++;
    this.store.set(key, windowData);

    // Check if limit exceeded
    return windowData.count > max;
  }

  getRateLimitResponse() {
    return NextResponse.json(
      { 
        error: 'Too many requests',
        message: 'Please try again later'
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(config.rateLimit.windowMs / 1000).toString()
        }
      }
    );
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now - data.start > config.rateLimit.windowMs) {
        this.store.delete(key);
      }
    }
  }

  // For testing and monitoring
  getRateLimitInfo(request) {
    const key = this.getKey(request);
    const routeType = key.split(':')[0];
    const { windowMs, max } = this.getRouteConfig(routeType);
    const windowData = this.store.get(key);

    if (!windowData) {
      return {
        remaining: max,
        reset: Date.now() + windowMs,
        limit: max
      };
    }

    const now = Date.now();
    const timeElapsed = now - windowData.start;

    // If window has expired, return fresh limits
    if (timeElapsed > windowMs) {
      return {
        remaining: max,
        reset: now + windowMs,
        limit: max
      };
    }

    return {
      remaining: Math.max(0, max - windowData.count),
      reset: windowData.start + windowMs,
      limit: max
    };
  }
}

// Create singleton instance
const rateLimit = new RateLimiter();

export default rateLimit;