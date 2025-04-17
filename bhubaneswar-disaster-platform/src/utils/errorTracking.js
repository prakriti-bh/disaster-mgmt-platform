import config from './config';

// Error severity levels
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Error categories for better organization
export const ErrorCategory = {
  API: 'api',
  AUTH: 'auth',
  VALIDATION: 'validation',
  NETWORK: 'network',
  DATABASE: 'database',
  UI: 'ui',
  RESOURCE: 'resource',
  NOTIFICATION: 'notification',
  MAP: 'map',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown'
};

class ErrorTracker {
  constructor() {
    // In-memory error store (use proper error tracking service in production)
    this.errors = [];
    this.maxStoredErrors = 1000;
  }

  track(error, {
    severity = ErrorSeverity.ERROR,
    category = ErrorCategory.UNKNOWN,
    userId = null,
    metadata = {}
  } = {}) {
    const errorEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      severity,
      category,
      userId,
      metadata: {
        ...metadata,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        environment: config.app.environment
      }
    };

    // Add to in-memory store
    this.errors.push(errorEntry);

    // Trim old errors if exceeding max size
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(-this.maxStoredErrors);
    }

    // Log to console in development
    if (config.app.isDev) {
      console.error('Error tracked:', errorEntry);
    }

    // In production, send to error tracking service
    if (config.app.isProd) {
      this.sendToErrorService(errorEntry);
    }

    return errorEntry.id;
  }

  // Helper to track API errors
  trackApiError(error, endpoint, metadata = {}) {
    return this.track(error, {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.API,
      metadata: {
        ...metadata,
        endpoint,
        statusCode: error.status || error.statusCode,
        method: metadata.method || 'unknown'
      }
    });
  }

  // Helper to track UI errors
  trackUiError(error, componentName, metadata = {}) {
    return this.track(error, {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.UI,
      metadata: {
        ...metadata,
        componentName,
        route: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      }
    });
  }

  // Helper to track network errors
  trackNetworkError(error, url, metadata = {}) {
    return this.track(error, {
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.NETWORK,
      metadata: {
        ...metadata,
        url,
        online: typeof navigator !== 'undefined' ? navigator.onLine : true
      }
    });
  }

  // Get recent errors for monitoring
  getRecentErrors({ 
    category = null, 
    severity = null,
    limit = 50 
  } = {}) {
    let filtered = [...this.errors];

    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }
    if (severity) {
      filtered = filtered.filter(e => e.severity === severity);
    }

    return filtered
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // Get error statistics for monitoring
  getErrorStats(timeRange = 24 * 60 * 60 * 1000) { // Default 24 hours
    const now = Date.now();
    const recentErrors = this.errors.filter(e => 
      now - new Date(e.timestamp).getTime() <= timeRange
    );

    return {
      total: recentErrors.length,
      bySeverity: this.groupBy(recentErrors, 'severity'),
      byCategory: this.groupBy(recentErrors, 'category')
    };
  }

  // Helper to group errors
  groupBy(errors, key) {
    return errors.reduce((acc, error) => {
      const value = error[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  // In production, implement this to send errors to your error tracking service
  async sendToErrorService(errorEntry) {
    // Example implementation:
    // try {
    //   await fetch('https://your-error-service.com/api/errors', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorEntry)
    //   });
    // } catch (error) {
    //   console.error('Failed to send error to tracking service:', error);
    // }
  }
}

// Create singleton instance
export const errorTracker = new ErrorTracker();

// Error boundary helper
export function withErrorTracking(error, componentName, metadata = {}) {
  errorTracker.trackUiError(error, componentName, metadata);
  return error;
}

// API error helper
export function withApiErrorTracking(fn, endpoint) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorTracker.trackApiError(error, endpoint, {
        arguments: args
      });
      throw error;
    }
  };
}

export default errorTracker;