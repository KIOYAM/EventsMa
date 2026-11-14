import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Toaster } from 'sonner'
import './globals.css'

// Font files live in the repo. A clean build never calls Google Fonts, so a
// network outage or a Google URL format change cannot break deployment.
const inter = localFont({
  src: './fonts/inter-latin.woff2',
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
})

const playfair = localFont({
  src: './fonts/playfair-display-latin.woff2',
  weight: '400 900',
  variable: '--font-playfair',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
  adjustFontFallback: 'Times New Roman',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'EventsMa — multi-service event quotations',
    template: '%s · EventsMa',
  },
  description:
    'Manage catering, decoration, photography and event services in one workspace. Build structured quotations, calculate taxes and see your margin before you send.',
  applicationName: 'EventsMa',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'EventsMa',
    title: 'EventsMa — multi-service event quotations',
    description:
      'One workspace for every event service you provide. Server-verified totals, real margin, customer-ready quotations.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#183d33',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // `lang` stays static here on purpose. Reading the locale cookie in the root
  // layout turns every page dynamic: measured, `/`, `/terms`, `/privacy`,
  // `/forgot-password` and `/_not-found` stopped being prerendered for a tag that
  // nothing reads yet.
  // When the translation rollout lands (docs/designs/2026-11-14-localization-engine.md)
  // the marketing routes move to a route group that keeps `lang="en-IN"`, and the
  // signed-in and public-link trees read `getLocale()` instead.
  return (
    <html lang="en-IN" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          richColors
          toastOptions={{ duration: 4000 }}
        />
      </body>
    </html>
  )
}
