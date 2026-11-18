import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { STOREFRONT_LOOK } from '@/lib/domain/storefront-look'
import {
  getPublicProfile,
  getPublicServiceItems,
  getPublicCatalogueItem,
  type PublicCatalogueItem,
} from '@/lib/db/public'

export const revalidate = 300
export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; item: string }>
}): Promise<Metadata> {
  const { slug, item } = await params
  const service = await getPublicServiceItems(slug, item)
  if (service) {
    const descriptor = service.profile.services.find((s) => s.verticalKey === item)
    return {
      title: `${descriptor?.label ?? item} · ${service.profile.name}`,
      alternates: { canonical: `/p/${service.profile.slug}/services/${item}` },
    }
  }
  const found = await getPublicCatalogueItem(slug, item)
  if (found) {
    return {
      title: `${found.item.name} · ${found.profile.name}`,
      alternates: { canonical: `/p/${found.profile.slug}/services/${item}` },
    }
  }
  return { title: 'Not found', robots: { index: false, follow: false } }
}

export default async function PublicServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string; item: string }>
}) {
  const { slug, item } = await params

  const serviceView = await getPublicServiceItems(slug, item)
  if (serviceView) {
    const { profile, items } = serviceView
    const look = STOREFRONT_LOOK[profile.theme]
    const service = profile.services.find((s) => s.verticalKey === item)
    const brandStyle = { '--brand': profile.brandPrimary } as React.CSSProperties
    return (
      <main className={`min-h-dvh scroll-smooth ${look.page}`}>
        <div className={`storefront ${look.shell} pt-4 sm:pt-6`} style={brandStyle}>
          <p className="mb-4 text-sm">
            <a href={`/p/${profile.slug}`} className="underline underline-offset-4">
              ← {profile.name}
            </a>
          </p>
          <section className={look.section}>
            <div className={look.headWrap}>
              <p className={look.overline}>{service?.label ?? item}</p>
              <h1 className={look.heading}>{service?.label ?? item}</h1>
              <div aria-hidden className={look.rule} />
              <p className={look.subhead}>
                {items.length}{' '}
                {items.length === 1
                  ? (service?.itemNoun ?? 'item')
                  : `${service?.itemNoun ?? 'item'}s`}{' '}
                on the catalogue
              </p>
            </div>
            {items.length === 0 ? (
              <p className={`mt-6 text-sm ${look.muted}`}>Nothing on the catalogue yet.</p>
            ) : (
              <div className={look.gridWide}>
                {items.map((row: PublicCatalogueItem) => (
                  <article key={row.id} className={look.card}>
                    <div className={look.cardBody}>
                      {row.category ? <p className={look.count}>{row.category}</p> : null}
                      <h2 className={`mt-1.5 ${look.cardTitle}`}>{row.name}</h2>
                      <p className={`mt-1 text-xs ${look.muted}`}>{row.unit}</p>
                      {row.description ? (
                        <p className={`mt-2 text-xs leading-relaxed ${look.muted}`}>{row.description}</p>
                      ) : null}
                      {row.dietary ? (
                        <p className={`mt-1 text-[11px] ${look.muted}`}>{row.dietary}</p>
                      ) : null}
                      <a href={`/p/${profile.slug}#enquiry`} className={`mt-3 ${look.link}`}>
                        Ask about this
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <footer className={look.footer}>
            <p className="opacity-70">
              <a href={`/p/${profile.slug}`} className="hover:underline">
                Back to {profile.name}
              </a>
            </p>
          </footer>
        </div>
      </main>
    )
  }

  const itemData = await getPublicCatalogueItem(slug, item)
  if (!itemData) notFound()

  const { profile, item: found } = itemData
  const look = STOREFRONT_LOOK[profile.theme]
  const brandStyle = { '--brand': profile.brandPrimary } as React.CSSProperties
  return (
    <main className={`min-h-dvh scroll-smooth ${look.page}`}>
      <div className={`storefront ${look.shell} pt-4 sm:pt-6`} style={brandStyle}>
        <p className="mb-4 text-sm">
          <a href={`/p/${profile.slug}`} className="underline underline-offset-4">
            ← {profile.name}
          </a>
        </p>
        <section className={look.section}>
          <div className={look.headWrap}>
            {found.category ? <p className={look.overline}>{found.category}</p> : null}
            <h1 className={look.heading}>{found.name}</h1>
            <div aria-hidden className={look.rule} />
            <p className={look.subhead}>{found.unit}</p>
          </div>
          {found.description ? (
            <p className={`mx-auto mt-6 max-w-2xl text-sm leading-[1.8] ${look.muted}`}>{found.description}</p>
          ) : null}
          {found.dietary ? (
            <p className={`mt-2 text-center text-xs ${look.muted}`}>{found.dietary}</p>
          ) : null}
          <div className="mt-8 text-center">
            <a href={`/p/${profile.slug}#enquiry`} className={look.ctaPrimary}>
              Ask about this
            </a>
          </div>
        </section>
        <footer className={look.footer}>
          <p className="opacity-70">
            <a href={`/p/${profile.slug}`} className="hover:underline">
              Back to {profile.name}
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}
