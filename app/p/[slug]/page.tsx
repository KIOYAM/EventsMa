import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StorefrontPublicPage } from '@/components/storefront/public-page'
import { isDemoEnvironment } from '@/lib/environment'
import { isDatabaseConfigured } from '@/lib/db/client'
import { demoPublicProfile, getPublicProfile } from '@/lib/db/public'
import { resolveSeo } from '@/lib/domain/storefront-seo'
import { appUrl } from '@/lib/app-url'

export const revalidate = 300
export const dynamicParams = true

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (isDemoEnvironment()) return [{ slug: demoPublicProfile().slug }]
  if (!isDatabaseConfigured()) return []
  try {
    // Build-time public listing: there is no request identity to scope.
    const { getSystemDb } = await import('@/lib/db/client')
    const { businesses, organisations } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const rows = await getSystemDb()
      .select({ slug: organisations.slug })
      .from(businesses)
      .innerJoin(organisations, eq(businesses.orgId, organisations.id))
      .where(eq(businesses.published, true))
      .limit(1000)
    return rows
  } catch {
    // A build-time database hiccup must not block the deploy. The route falls
    // back to on-demand rendering and caches the result for 5 minutes.
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = isDemoEnvironment() ? demoPublicProfile() : await getPublicProfile(slug)
  if (!profile) {
    return { title: 'Business not found', robots: { index: false, follow: false } }
  }

  // The owner's overrides are frozen in the published version, so a draft title
  // cannot reach a crawler before it goes live.
  const seo = resolveSeo(profile.seo, {
    title: profile.name,
    description:
      profile.tagline ??
      `${profile.name} in ${profile.city ?? 'India'} - event services, menus and enquiries.`,
  })
  const ogImage = `${appUrl()}/p/${profile.slug}/opengraph-image`
  const twitterCard = profile.services.length > 0 ? 'summary_large_image' : 'summary'

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/p/${profile.slug}` },
    openGraph: {
      type: 'website',
      title: seo.title,
      description: seo.description,
      url: `/p/${profile.slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${profile.name} — event services and catalogue`,
        },
      ],
      siteName: 'EventsMa',
    },
    twitter: {
      card: twitterCard,
      title: seo.title,
      description: seo.description,
      images: [ogImage],
      site: '@eventsma',
    },
    // `noindex` hides the page from search without unpublishing it, so a link can
    // still be shared with clients while the owner finishes the wording.
    robots: seo.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const demo = isDemoEnvironment()
  const profile = demo ? demoPublicProfile() : await getPublicProfile(slug)

  if (!profile) notFound()

  return <StorefrontPublicPage profile={profile} demo={demo} />
}
