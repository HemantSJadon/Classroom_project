import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Strict mode catches double-render bugs in development
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Security / caching headers for all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Long-lived cache for Next.js static chunks
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Image optimisation — add remote domains here if user avatars are hosted elsewhere
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },

  // Bundle analyser: set ANALYZE=true before `next build` to inspect
  ...(process.env.ANALYZE === 'true' && {
    experimental: {
      // No extra flags needed — @next/bundle-analyzer wraps config externally
    },
  }),
};

export default nextConfig;
