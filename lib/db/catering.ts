import { and, asc, eq } from 'drizzle-orm'
import { getDb } from './client'
import { businessServices } from './schema'
import {
  cateringSessions,
  categorySelectionRules,
  dietaryProfiles,
  menuCategories,
} from './schema-catering'

/**
 * Catering reads.
 *
 * Three queries, no N+1: services (the gate), configuration and rules. The rules
 * matrix is stitched in memory because it is at most sessions × categories rows,
 * a few dozen, and one round trip beats one query per session.
 */

export const CATERING_VERTICAL = 'catering'

/** Verticals the business actually offers. Drives the sidebar gate. */
export async function getEnabledVerticals(orgId: string, demo: boolean): Promise<string[]> {
  if (demo) return [CATERING_VERTICAL, 'photography', 'decor', 'specialist']

  const db = getDb()
  const rows = await db
    .select({ key: businessServices.verticalKey })
    .from(businessServices)
    .where(and(eq(businessServices.orgId, orgId), eq(businessServices.enabled, true)))

  return rows.map((row) => row.key)
}

export async function isCateringEnabled(orgId: string, demo: boolean): Promise<boolean> {
  if (demo) return true
  const db = getDb()
  const [row] = await db
    .select({ id: businessServices.id })
    .from(businessServices)
    .where(
      and(
        eq(businessServices.orgId, orgId),
        eq(businessServices.verticalKey, CATERING_VERTICAL),
        eq(businessServices.enabled, true),
      ),
    )
    .limit(1)
  return Boolean(row)
}

export interface CateringSessionView {
  id: string
  name: string
  description: string | null
  startTime: string | null
  endTime: string | null
  minGuests: number | null
  maxGuests: number | null
  cutoffHours: number | null
  sortOrder: number
  active: boolean
}

export interface CateringCategoryView {
  id: string
  name: string
  description: string | null
  sortOrder: number
  active: boolean
}

export interface CateringRuleView {
  id: string
  sessionId: string
  categoryId: string
  minSelections: number
  maxSelections: number | null
  required: boolean
  pricingMode: string
}

export interface DietaryProfileView {
  id: string
  key: string
  label: string
  isAllergen: boolean
  active: boolean
}

export interface CateringConfig {
  enabled: boolean
  sessions: CateringSessionView[]
  categories: CateringCategoryView[]
  rules: CateringRuleView[]
  diets: DietaryProfileView[]
}

const EMPTY: CateringConfig = {
  enabled: false,
  sessions: [],
  categories: [],
  rules: [],
  diets: [],
}

export async function getCateringConfig(orgId: string, demo: boolean): Promise<CateringConfig> {
  if (demo) return EMPTY

  const db = getDb()

  const [enabled, sessions, categories, rules, diets] = await Promise.all([
    isCateringEnabled(orgId, demo),
    db
      .select({
        id: cateringSessions.id,
        name: cateringSessions.name,
        description: cateringSessions.description,
        startTime: cateringSessions.startTime,
        endTime: cateringSessions.endTime,
        minGuests: cateringSessions.minGuests,
        maxGuests: cateringSessions.maxGuests,
        cutoffHours: cateringSessions.cutoffHours,
        sortOrder: cateringSessions.sortOrder,
        active: cateringSessions.active,
      })
      .from(cateringSessions)
      .where(eq(cateringSessions.orgId, orgId))
      .orderBy(asc(cateringSessions.sortOrder), asc(cateringSessions.name)),
    db
      .select({
        id: menuCategories.id,
        name: menuCategories.name,
        description: menuCategories.description,
        sortOrder: menuCategories.sortOrder,
        active: menuCategories.active,
      })
      .from(menuCategories)
      .where(eq(menuCategories.orgId, orgId))
      .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name)),
    db
      .select({
        id: categorySelectionRules.id,
        sessionId: categorySelectionRules.sessionId,
        categoryId: categorySelectionRules.categoryId,
        minSelections: categorySelectionRules.minSelections,
        maxSelections: categorySelectionRules.maxSelections,
        required: categorySelectionRules.required,
        pricingMode: categorySelectionRules.pricingMode,
      })
      .from(categorySelectionRules)
      .where(eq(categorySelectionRules.orgId, orgId)),
    db
      .select({
        id: dietaryProfiles.id,
        key: dietaryProfiles.key,
        label: dietaryProfiles.label,
        isAllergen: dietaryProfiles.isAllergen,
        active: dietaryProfiles.active,
      })
      .from(dietaryProfiles)
      .where(eq(dietaryProfiles.orgId, orgId))
      .orderBy(asc(dietaryProfiles.sortOrder), asc(dietaryProfiles.label)),
  ])

  return { enabled, sessions, categories, rules, diets }
}
