import type { MetadataRoute } from 'next'
import { appUrl } from '@/lib/app-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/events',
        '/clients',
        '/quotes',
        '/invoices',
        '/finance',
        '/reports',
        '/team',
        '/services',
        '/portfolio',
        '/storefront',
        '/settings',
        '/catalogue',
        '/menu',
        '/packages',
        '/inventory',
        '/me',
        '/admin',
        '/onboarding',
        '/invite',
        '/q',
        '/api',
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  }
}
