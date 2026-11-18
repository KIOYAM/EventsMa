'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { isDatabaseConfigured } from '@/lib/db/client'
import { withWorkspace } from '@/lib/db/workspace'
import { getStorefrontSectionConfig, setStorefrontSectionConfig } from '@/lib/db/storefront'
import {
  SECTION_CONFIG_MAX_ITEMS,
  emptySectionConfig,
  type SectionConfig,
  type SectionKey,
} from '@/lib/domain/storefront'

/**
 * Content the owner writes inside a section: FAQ answers and team names.
 *
 * Two sections, one shape: the action picks the section, reads the current list
 * through the RLS-scoped handle, changes one entry, and writes the whole list
 * back. Nothing here trusts a posted id as ownership — the read is scoped to the
 * caller's organisation, so an id from another tenant simply is not found.
 */
type ListKey = 'faq' | 'team'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function text(formData: FormData, key: string, max: number): string {
  return String(formData.get(key) ?? '')
    .trim()
    .slice(0, max)
}

function itemId(formData: FormData): string | null {
  const raw = text(formData, 'itemId', 40)
  return UUID_RE.test(raw) ? raw : null
}

async function mutate(
  key: ListKey,
  change: (config: SectionConfig) => SectionConfig | 'limit',
): Promise<never> {
  const ctx = await requireWorkspace()
  return withWorkspace(ctx, async () => {
    if (!canManageCommercial(ctx.role)) redirect('/storefront/customise?error=permission')
    if (ctx.demo || !isDatabaseConfigured()) redirect('/storefront/customise?error=demo')

    const current = await getStorefrontSectionConfig(ctx.orgId, key as SectionKey)
    const next = change(current)
    if (next === 'limit') redirect('/storefront/customise?error=limit')

    await setStorefrontSectionConfig(ctx.orgId, key as SectionKey, next)

    revalidatePath('/storefront/customise')
    revalidatePath('/storefront')
    revalidatePath('/p', 'layout')
    redirect('/storefront/customise?saved=config')
  })
}

/** Add a question, or update the one with this id. */
export async function saveFaqItem(formData: FormData): Promise<void> {
  const id = itemId(formData)
  const question = text(formData, 'question', 160)
  const answer = text(formData, 'answer', 600)

  return mutate('faq', (current) => {
    if (!question || !answer) return current
    const items = current.faq
    if (id && items.some((item) => item.id === id)) {
      return {
        ...current,
        faq: items.map((item) => (item.id === id ? { id, question, answer } : item)),
      }
    }
    if (items.length >= SECTION_CONFIG_MAX_ITEMS) return 'limit'
    return {
      ...current,
      faq: [...items, { id: crypto.randomUUID(), question, answer }],
    }
  })
}

export async function removeFaqItem(formData: FormData): Promise<void> {
  const id = itemId(formData)
  return mutate('faq', (current) =>
    id ? { ...current, faq: current.faq.filter((item) => item.id !== id) } : current,
  )
}

/** Add a team member, or update the one with this id. */
export async function saveTeamMember(formData: FormData): Promise<void> {
  const id = itemId(formData)
  const name = text(formData, 'name', 80)
  const role = text(formData, 'role', 80)

  return mutate('team', (current) => {
    if (!name) return current
    const members = current.team
    if (id && members.some((member) => member.id === id)) {
      return {
        ...current,
        team: members.map((member) => (member.id === id ? { id, name, role } : member)),
      }
    }
    if (members.length >= SECTION_CONFIG_MAX_ITEMS) return 'limit'
    return { ...current, team: [...members, { id: crypto.randomUUID(), name, role }] }
  })
}

export async function removeTeamMember(formData: FormData): Promise<void> {
  const id = itemId(formData)
  return mutate('team', (current) =>
    id ? { ...current, team: current.team.filter((member) => member.id !== id) } : current,
  )
}

/** Used by the builder's empty state so a section with no config still saves. */
export async function clearSectionConfig(formData: FormData): Promise<void> {
  const key = text(formData, 'key', 20)
  if (key !== 'faq' && key !== 'team') redirect('/storefront/customise?error=section')
  return mutate(key, () => emptySectionConfig())
}
