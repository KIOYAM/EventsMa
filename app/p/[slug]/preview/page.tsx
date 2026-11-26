import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StorefrontPublicPage } from '@/components/storefront/public-page'
import { requireWorkspace } from '@/lib/auth/session'
import { getDraftPublicProfile } from '@/lib/db/public'
import { withWorkspace } from '@/lib/db/workspace'

/**
 * The owner's page, rendered from the draft.
 *
 * Shopify lets a merchant preview an unpublished theme and Wix previews before
 * publish; until now we could only "publish and look". This route closes that
 * gap without inventing a shareable token: the visitor must be signed in to the
 * workspace that owns the slug, so a link to it is useless outside the team.
 *
 * It is deliberately dynamic (no ISR): a preview that serves a cached minute of
 * the past is exactly the confusion this screen exists to remove.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  // Never index a draft, even if it is accidentally linked.
  return { title: 'Storefront preview', robots: { index: false, follow: false } }
}

export default async function StorefrontPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await requireWorkspace()
  if (ctx.demo) notFound()

  const profile = await withWorkspace(ctx, () => getDraftPublicProfile(slug, ctx.orgId))
  // Wrong tenant, unknown slug, or a demo workspace: all indistinguishable 404s.
  if (!profile || profile.orgId !== ctx.orgId) notFound()

  return <StorefrontPublicPage profile={profile} demo={false} preview />
}
