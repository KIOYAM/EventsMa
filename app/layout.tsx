import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

// Self-hosted by next/font at build time: no runtime request to Google, two weights each.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'EventsMa — quote every service in minutes',
    template: '%s · EventsMa',
  },
  description:
    'One workspace for catering, decor, photography and every other service you provide. Price it, quote it, and know the margin before you send.',
  applicationName: 'EventsMa',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'EventsMa',
    title: 'EventsMa — quote every service in minutes',
    description:
      'One workspace for every event service you provide. Server-verified totals, real margin, WhatsApp-ready quotes.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#183d33',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
