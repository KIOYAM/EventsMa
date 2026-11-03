import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // @react-pdf/renderer must stay external. Bundling it for the server breaks
  // its reconciler at runtime ("Cannot read properties of undefined (reading 'S')").
  serverExternalPackages: ['@react-pdf/renderer'],

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

export default nextConfig
