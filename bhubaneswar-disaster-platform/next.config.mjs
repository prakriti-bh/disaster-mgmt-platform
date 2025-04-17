import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'mapbox-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'map-tiles-cache',
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    },
    {
      urlPattern: /\/api\/resources/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-resources-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 // 1 hour
        }
      }
    },
    {
      urlPattern: /\/locales\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'localization-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your-image-domain.com'], // Add domains for remote images if needed
  },
  i18n: {
    locales: ['en', 'or'],
    defaultLocale: 'en',
  },
  webpack: (config) => {
    // Handle Leaflet marker images
    config.module.rules.push({
      test: /\.(png|jpg|gif)$/i,
      type: 'asset/resource'
    });
    return config;
  }
};

export default withPWA(nextConfig);
