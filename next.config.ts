import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs/config'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // @react-pdf/renderer must stay external. Bundling it for the server breaks
  // its reconciler at runtime ("Cannot read properties of undefined (reading 'S')").
  serverExternalPackages: ['@react-pdf/renderer'],

  // The Tamil PDF font is read from disk while rendering. Without this trace the
  // file is absent from the deployed function and a Tamil quotation fails on
  // Vercel while working locally.
  outputFileTracingIncludes: {
    '/api/quotes/[id]/pdf': ['./app/fonts/*.ttf'],
  },

  // Tree-shake barrel imports so a single icon does not ship the whole set.
  experimental: {
    optimizePackageImports: ['lucide-react', 'sonner'],
    staleTimes: { dynamic: 0, static: 180 },
  },

  images: {
    // AVIF first, WebP fallback. Both are served from the edge with a long TTL.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31_536_000,
    deviceSizes: [360, 420, 640, 828, 1080, 1600],
    imageSizes: [72, 120, 320],
  },

  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ]
  },
}

// Source maps upload only when SENTRY_ORG, SENTRY_PROJECT and SENTRY_AUTH_TOKEN
// are present. Error reporting itself needs only the DSN.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
})
