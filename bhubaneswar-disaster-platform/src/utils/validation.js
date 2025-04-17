import { z } from 'zod';

// Common fields that are reused across schemas
const commonFields = {
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  })
};

// User schemas
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[\d\s-]{10,}$/).optional(),
  role: z.enum(['user', 'admin']).default('user'),
  preferences: z.object({
    language: z.enum(['en', 'or']).default('en'),
    notifications: z.boolean().default(true),
    alertRadius: z.number().min(1).max(50).default(10)
  }).default({})
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Alert schemas
export const alertSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(1000),
  severity: z.enum(['info', 'warning', 'critical', 'emergency']),
  area: z.string().min(2).max(200),
  source: z.string().min(2).max(200),
  expiresAt: z.string().datetime().optional(),
  location: commonFields.location,
  metadata: z.record(z.string()).optional()
});

// Report schemas
export const reportSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(1000),
  type: z.enum(['incident', 'damage', 'resource', 'other']),
  location: commonFields.location,
  images: z.array(z.string().url()).max(5).optional(),
  contact: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().regex(/^\+?[\d\s-]{10,}$/).optional(),
    email: z.string().email().optional()
  }).optional(),
  metadata: z.record(z.string()).optional()
});

// Resource schemas
export const resourceSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['shelter', 'medical', 'food', 'water', 'other']),
  description: z.string().min(10).max(500),
  location: commonFields.location,
  capacity: z.object({
    total: z.number().min(0),
    available: z.number().min(0)
  }).optional(),
  contact: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().regex(/^\+?[\d\s-]{10,}$/).optional(),
    email: z.string().email().optional()
  }).optional(),
  status: z.enum(['active', 'inactive', 'full']).default('active'),
  operatingHours: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  metadata: z.record(z.string()).optional()
});

// Notification schemas
export const notificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
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

// Subscription schema
export const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
});

// Helper function to validate request data
export function validateRequest(data, schema) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = {};
    result.error.errors.forEach(err => {
      const path = err.path.join('.');
      details[path] = err.message;
    });
    
    throw new Error('Validation failed: ' + JSON.stringify(details));
  }
  return result.data;
}