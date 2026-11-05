import 'server-only'
import { and, asc, desc, eq } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import { businesses, memberships, organisations, portfolioItems } from './schema'
import type { PortfolioRow, SettingsData, StaffOption } from '@/lib/domain/ops'
import { paymentDetailsFrom } from '@/lib/domain/payments'
import { demoPortfolio, demoSettings, demoStaff } from '@/lib/demo/workspace'

const FALLBACK_SLUG = 'workspace'

export async function getSettings(orgId: string, demo: boolean): Promise<SettingsData> {
  if (demo || !isDatabaseConfigured()) return demoSettings

  const db = getDb()
  const [row] = await db
    .select({
      orgName: organisations.name,
      plan: organisations.plan,
      name: businesses.name,
      tagline: businesses.tagline,
      city: businesses.city,
      district: businesses.district,
      phone: businesses.phone,
      email: businesses.email,
      published: businesses.published,
      settings: businesses.settings,
      slug: organisations.slug,
    })
    .from(businesses)
    .innerJoin(organisations, eq(businesses.orgId, organisations.id))
    .where(eq(businesses.orgId, orgId))
    .limit(1)

  if (!row) {
    return {
      ...demoSettings,
      orgName: 'Your business',
      plan: 'trial',
      name: 'Your business',
      tagline: null,
      city: null,
      district: null,
      phone: null,
      email: null,
      slug: FALLBACK_SLUG,
      published: false,
      settings: {
        ...demoSettings.settings,
        serviceAreas: [],
        brandPrimary: '#1f4d3a',
        brandFont: 'Inter',
      },
    }
  }

  const settings = row.settings ?? {}
  return {
    orgName: row.orgName,
    plan: row.plan,
    name: row.name,
    tagline: row.tagline,
    city: row.city,
    district: row.district,
    phone: row.phone,
    email: row.email,
    slug: row.slug,
    published: row.published,
    settings: {
      taxMode: settings.taxMode ?? 'exclusive',
      advancePct: settings.advancePct ?? 30,
      quoteValidityDays: settings.quoteValidityDays ?? 7,
      serviceAreas: settings.serviceAreas ?? [],
      brandPrimary: settings.brand?.primary ?? '#1f4d3a',
      brandFont: settings.brand?.font ?? 'Inter',
      payment: paymentDetailsFrom(settings.payment),
    },
  }
}

export async function getPortfolio(orgId: string, demo: boolean): Promise<PortfolioRow[]> {
  if (demo || !isDatabaseConfigured()) return demoPortfolio

  return getDb()
    .select({
      id: portfolioItems.id,
      title: portfolioItems.title,
      eventDate: portfolioItems.eventDate,
      venueName: portfolioItems.venueName,
      description: portfolioItems.description,
      published: portfolioItems.published,
    })
    .from(portfolioItems)
    .where(eq(portfolioItems.orgId, orgId))
    .orderBy(desc(portfolioItems.eventDate), asc(portfolioItems.sortOrder))
    .limit(60)
}

export async function getStaffOptions(orgId: string, demo: boolean): Promise<StaffOption[]> {
  if (demo || !isDatabaseConfigured()) return demoStaff

  const rows = await getDb()
    .select({
      id: memberships.id,
      displayName: memberships.displayName,
      email: memberships.email,
      role: memberships.role,
      skills: memberships.skills,
    })
    .from(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.status, 'active')))
    .orderBy(asc(memberships.displayName))

  return rows.map((row) => ({
    id: row.id,
    name: row.displayName ?? row.email ?? 'Member',
    role: row.role,
    skills: row.skills,
  }))
}
