const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Bhubaneswar Disaster Platform',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production'
  },

  api: {
    url: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: parseInt(process.env.API_TIMEOUT || '10000', 10)
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-min-32-chars',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    cookieSecret: process.env.COOKIE_SECRET || 'your-cookie-secret-min-32-chars'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  maps: {
    defaultCenter: {
      lat: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '20.296059'),
      lng: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '85.824539')
    },
    defaultZoom: parseInt(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM || '13', 10)
  },

  features: {
    offlineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE !== 'false',
    notifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS !== 'false'
  },

  i18n: {
    defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en',
    availableLocales: (process.env.NEXT_PUBLIC_AVAILABLE_LOCALES || 'en,or').split(',')
  }
};

// Validate required environment variables in production
if (config.app.isProd) {
  const requiredVars = [
    'JWT_SECRET',
    'COOKIE_SECRET'
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate minimum length for secrets
  if (process.env.JWT_SECRET?.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  if (process.env.COOKIE_SECRET?.length < 32) {
    throw new Error('COOKIE_SECRET must be at least 32 characters long');
  }
}

export default config;