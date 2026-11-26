import { ImageResponse } from 'next/og'
import { demoPublicProfile, getPublicProfile } from '@/lib/db/public'
import { isDemoEnvironment } from '@/lib/environment'

/**
 * A social card per storefront.
 *
 * The static `/opengraph-image.png` says "EventsMa", which is the wrong brand on
 * a link a client forwards. This renders the tenant's own name, city and colour
 * from published data, so a WhatsApp preview looks like the business rather than
 * like the platform that hosts it.
 */
export const alt = 'Storefront'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function StorefrontOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const profile = isDemoEnvironment() ? demoPublicProfile() : await getPublicProfile(slug)

  const name = profile?.name ?? 'EventsMa'
  const city = profile?.city ?? ''
  const tagline = profile?.tagline ?? ''
  const brand = profile?.brandPrimary ?? '#183d33'
  const services = profile?.services.map((service) => service.label).slice(0, 3).join(' · ') ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: brand,
          color: 'white',
          padding: '64px 72px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.7 }}>
          {city || 'Event services'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.05, maxWidth: 980 }}>{name}</div>
          {tagline ? (
            <div style={{ display: 'flex', fontSize: 30, lineHeight: 1.4, maxWidth: 900, opacity: 0.85 }}>
              {tagline}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', fontSize: 24, opacity: 0.75 }}>{services}</div>
          <div style={{ display: 'flex', fontSize: 24, opacity: 0.6 }}>eventsma.in</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
