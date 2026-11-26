import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StorefrontPublicPage } from '@/components/storefront/public-page'
import { getDraftPublicProfile } from '@/lib/db/public'
import { storefrontPublic } from '@/lib/i18n/messages/en/storefront-public'
import { verifyPreviewToken } from '@/lib/security/storefront-preview-token'

/**
 * The preview link an owner sends a client.
 *
 * No session: the signed token is the authorisation, and it only names one
 * organisation, one slug and an expiry. The org is checked against the slug's
 * current owner, so a renamed-and-reused slug cannot inherit an old link.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: storefrontPublic.preview.sharedLabel,
    robots: { index: false, follow: false },
  }
}

export default async function SharedStorefrontPreviewPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>
}) {
  const { slug, token } = await params

  const claims = verifyPreviewToken(token)
  if (!claims || claims.slug !== slug) notFound()

  // The loader already refuses a slug that does not belong to `claims.orgId`, so a
  // second comparison here would only repeat it.
  const profile = await getDraftPublicProfile(slug, claims.orgId)
  if (!profile) notFound()

  return <StorefrontPublicPage profile={profile} demo={false} preview shared />
}
