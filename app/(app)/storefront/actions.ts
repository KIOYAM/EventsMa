'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { publishStorefront, restoreStorefrontVersion } from '@/lib/db/storefronts'
import { withWorkspace } from '@/lib/db/workspace'
import {
  getStorefrontBrand,
  getStorefrontSections,
  moveStorefrontSection,
  resetStorefrontSections,
  setStorefrontBrand,
  setStorefrontSectionHeading,
  setStorefrontSectionImage,
  setStorefrontSectionVisible,
  updateStorefrontIdentity,
} from '@/lib/db/storefront'
import { isPortfolioStorageConfigured } from '@/lib/storage/portfolio-images'
import { removeStorefrontImage, uploadStorefrontImage } from '@/lib/storage/storefront-image'
import {
  SECTION_KEYS,
  resolveStorefrontFont,
  resolveStorefrontTheme,
  type SectionKey,
} from '@/lib/domain/storefront'
import { organisations } from '@/lib/db/schema'

/**
 * The storefront builder's writes.
 *
 * Every action resolves the workspace on the server and never trusts a posted
 * org, so a hidden field can only name a section, never a tenant. Owners and
 * managers only; `withWorkspace` runs the write under RLS as well.
 */
function sectionKey(formData: FormData): SectionKey | null {
  const raw = String(formData.get('key') ?? '')
  return (SECTION_KEYS as readonly string[]).includes(raw) ? (raw as SectionKey) : null
}

function back(reason?: string): never {
  revalidatePath('/storefront')
  revalidatePath('/storefront/customise')
  revalidatePath('/p', 'layout')
  redirect(reason ? `/storefront/customise?error=${reason}` : '/storefront/customise?saved=1')
}

export async function reorderSection(formData: FormData): Promise<void> {
  const key = sectionKey(formData)
  const direction = formData.get('direction') === 'up' ? 'up' : 'down'
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront?error=demo')
    if (!key) redirect('/storefront?error=section')
    await moveStorefrontSection(ctx.orgId, key, direction)
    back()
  })
}

export async function toggleSection(formData: FormData): Promise<void> {
  const key = sectionKey(formData)
  const visible = formData.get('visible') === '1'
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront?error=demo')
    if (!key) redirect('/storefront?error=section')
    await setStorefrontSectionVisible(ctx.orgId, key, visible)
    back()
  })
}

export async function saveSectionHeading(formData: FormData): Promise<void> {
  const key = sectionKey(formData)
  const heading = String(formData.get('heading') ?? '')
    .trim()
    .slice(0, 80)
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront?error=demo')
    if (!key) redirect('/storefront?error=section')
    await setStorefrontSectionHeading(ctx.orgId, key, heading || null)
    back()
  })
}

export async function uploadSectionImage(formData: FormData): Promise<void> {
  const key = sectionKey(formData)
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront?error=demo')
    if (!key) redirect('/storefront?error=section')
    if (!isPortfolioStorageConfigured()) redirect('/storefront?error=storage')

    const image = formData.get('image')
    if (!(image instanceof File) || image.size === 0) redirect('/storefront?error=image')

    let path: string | null = null
    try {
      path = (await uploadStorefrontImage(ctx.orgId, image)).path
    } catch (error) {
      const reason = error instanceof Error && /Invalid image/.test(error.message) ? 'image' : 'upload'
      redirect(`/storefront?error=${reason}`)
    }
    if (!path) redirect('/storefront?error=upload')

    await setStorefrontSectionImage(ctx.orgId, key, path)
    back()
  })
}

export async function clearSectionImage(formData: FormData): Promise<void> {
  const key = sectionKey(formData)
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront?error=demo')
    if (!key) redirect('/storefront?error=section')

    const current = await withSectionImage(ctx.orgId, key)
    await setStorefrontSectionImage(ctx.orgId, key, null)
    await removeStorefrontImage(current)
    back()
  })
}

export async function chooseTheme(formData: FormData): Promise<void> {
  const theme = resolveStorefrontTheme(formData.get('theme'))
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront/customise?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront/customise?error=demo')
    await setStorefrontBrand(ctx.orgId, { theme })
    back()
  })
}

function text(formData: FormData, key: string, max = 160): string {
  return String(formData.get(key) ?? '').trim().slice(0, max)
}

/** Identity columns: the name a client sees, and how to reach the business. */
export async function saveIdentity(formData: FormData): Promise<void> {
  const name = text(formData, 'name', 120)
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront/customise?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront/customise?error=demo')
    if (!name) redirect('/storefront/customise?error=name')

    await updateStorefrontIdentity(ctx.orgId, {
      name,
      tagline: text(formData, 'tagline', 200) || null,
      city: text(formData, 'city', 80) || null,
      phone: text(formData, 'phone', 24) || null,
    })
    // The workspace label follows the public name for an owner.
    if (ctx.role === 'owner') {
      await getDb().update(organisations).set({ name }).where(eq(organisations.id, ctx.orgId))
    }
    back()
  })
}

/** Colour, wordmark style and the paragraph under the name. */
export async function saveBrand(formData: FormData): Promise<void> {
  const colour = text(formData, 'primary', 7)
  const primary = /^#[0-9a-fA-F]{6}$/.test(colour) ? colour : null
  const font = resolveStorefrontFont(formData.get('font'))
  const theme = resolveStorefrontTheme(formData.get('theme'))
  const subtitle = text(formData, 'subtitle', 120)
  const about = text(formData, 'about', 600)

  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront/customise?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront/customise?error=demo')

    await setStorefrontBrand(ctx.orgId, {
      font,
      theme,
      subtitle: subtitle || null,
      about: about || null,
      ...(primary ? { primary } : {}),
    })
    back()
  })
}

async function replaceLogo(formData: FormData, kind: 'upload' | 'clear'): Promise<void> {
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront/customise?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront/customise?error=demo')

    const brand = await getStorefrontBrand(ctx.orgId, false)
    if (kind === 'clear') {
      await setStorefrontBrand(ctx.orgId, { logoPath: null })
      await removeStorefrontImage(brand.logoPath)
      back()
    }

    if (!isPortfolioStorageConfigured()) redirect('/storefront/customise?error=storage')
    const image = formData.get('logo')
    if (!(image instanceof File) || image.size === 0) {
      redirect('/storefront/customise?error=image')
    }

    let path: string | null = null
    try {
      path = (await uploadStorefrontImage(ctx.orgId, image)).path
    } catch (error) {
      const reason =
        error instanceof Error && /Invalid image/.test(error.message) ? 'image' : 'upload'
      redirect(`/storefront/customise?error=${reason}`)
    }
    if (!path) redirect('/storefront/customise?error=upload')

    await setStorefrontBrand(ctx.orgId, { logoPath: path })
    await removeStorefrontImage(brand.logoPath)
    back()
  })
}

export async function uploadLogo(formData: FormData): Promise<void> {
  return replaceLogo(formData, 'upload')
}

export async function clearLogo(): Promise<void> {
  const formData = new FormData()
  return replaceLogo(formData, 'clear')
}

/**
 * Publish the current draft as the next immutable version.
 *
 * This is the only path that can change what a visitor sees. Saving a heading or
 * a colour writes draft rows; until this runs, the public page keeps serving the
 * previous snapshot.
 */
async function publishAndReturn(): Promise<never> {
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront/customise?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront/customise?error=demo')

    const result = await publishStorefront(ctx.orgId, ctx.userId)
    if (!result.ok) {
      redirect(`/storefront/customise?error=${result.error === 'empty-name' ? 'name' : 'publish'}`)
    }

    revalidatePath('/storefront/customise')
    revalidatePath('/storefront')
    revalidatePath('/p', 'layout')
    redirect('/storefront/customise?saved=publish')
  })
}

export async function publishPage(): Promise<void> {
  return publishAndReturn()
}

/**
 * Restore: copy an old snapshot into the draft, then publish it as a new
 * version. History is never rewritten, so the live pointer always has a parent
 * that can be inspected.
 */
export async function restorePageVersion(formData: FormData): Promise<void> {
  const versionId = text(formData, 'versionId', 64)
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront/customise?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront/customise?error=demo')
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(versionId)) {
      redirect('/storefront/customise?error=version')
    }

    const result = await restoreStorefrontVersion(ctx.orgId, versionId, ctx.userId)
    if (!result.ok) {
      redirect(`/storefront/customise?error=${result.error === 'version' ? 'version' : 'publish'}`)
    }

    revalidatePath('/storefront/customise')
    revalidatePath('/storefront')
    revalidatePath('/p', 'layout')
    redirect('/storefront/customise?saved=restore')
  })
}

export async function resetLayout(): Promise<void> {
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront?error=demo')
    await resetStorefrontSections(ctx.orgId)
    back()
  })
}

/** The stored path, read before it is cleared so the object can be removed too. */
async function withSectionImage(orgId: string, key: SectionKey): Promise<string | null> {
  const sections = await getStorefrontSections(orgId, false)
  return sections.find((section) => section.key === key)?.imagePath ?? null
}
