import { and, asc, eq, inArray } from 'drizzle-orm'
import { getDb } from './client'
import { events, serviceItems } from './schema'
import {
  cateringSessions,
  categorySelectionRules,
  dietaryProfiles,
  eventCateringSessions,
  menuCategories,
  menuItemCategories,
  menuItemIngredients,
  sessionDietaryCounts,
  sessionMenuItems,
} from './schema-catering'
import {
  aggregateIngredients,
  eventCateringTotals,
  sessionTotals,
  type IngredientDemand,
  type IngredientUnit,
  type SelectionRule,
  type SessionTotals,
} from '@/lib/domain/catering'
import type { UnitClass } from '@/lib/domain/units'

/**
 * The event catering panel's reads.
 *
 * Every query is anchored on the event's sessions (or on the org), then stitched
 * in memory — no query per session, no query per category, no query per dish.
 */

export interface EventSessionItemView {
  id: string
  itemId: string | null
  categoryId: string | null
  name: string
  unitClass: UnitClass
  unitPricePaise: number
  quantity: number
  dietary: string | null
}

export interface EventSessionView {
  id: string
  templateId: string | null
  name: string
  sessionDate: string | null
  startTime: string | null
  endTime: string | null
  guestCount: number
  serviceStyle: string | null
  status: string
  notes: string | null
  items: EventSessionItemView[]
  totals: SessionTotals
  dietaryCounts: Record<string, number>
}

export interface RuleView {
  categoryId: string
  rule: SelectionRule | null
  pricingMode: string
}

export interface DishView {
  id: string
  name: string
  pricePaise: number
  unitClass: UnitClass
  dietary: string | null
}

export interface EventCateringView {
  event: { id: string; title: string; eventDate: string | null; guests: number }
  sessions: EventSessionView[]
  categories: { id: string; name: string }[]
  /** Rules for a session, keyed by category. Absent = no rule configured. */
  rulesBySession: Record<string, RuleView[]>
  dishesByCategory: Record<string, DishView[]>
  diets: { key: string; label: string; isAllergen: boolean }[]
  templates: { id: string; name: string; startTime: string | null; endTime: string | null }[]
  totals: { sessionCount: number; guests: number; subtotalPaise: number; totalPaise: number }
  production: IngredientDemand[]
}

const EMPTY: EventCateringView = {
  event: { id: '', title: '', eventDate: null, guests: 0 },
  sessions: [],
  categories: [],
  rulesBySession: {},
  dishesByCategory: {},
  diets: [],
  templates: [],
  totals: { sessionCount: 0, guests: 0, subtotalPaise: 0, totalPaise: 0 },
  production: [],
}

export async function getEventCatering(
  orgId: string,
  eventId: string,
  demo: boolean,
): Promise<EventCateringView | null> {
  if (demo) return EMPTY

  const db = getDb()

  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      eventDate: events.eventDate,
      guests: events.guests,
    })
    .from(events)
    .where(and(eq(events.orgId, orgId), eq(events.id, eventId)))
    .limit(1)

  if (!event) return null

  const [sessions, categories, diets, templates] = await Promise.all([
    db
      .select({
        id: eventCateringSessions.id,
        templateId: eventCateringSessions.templateId,
        name: eventCateringSessions.name,
        sessionDate: eventCateringSessions.sessionDate,
        startTime: eventCateringSessions.startTime,
        endTime: eventCateringSessions.endTime,
        guestCount: eventCateringSessions.guestCount,
        serviceStyle: eventCateringSessions.serviceStyle,
        status: eventCateringSessions.status,
        notes: eventCateringSessions.notes,
      })
      .from(eventCateringSessions)
      .where(and(eq(eventCateringSessions.orgId, orgId), eq(eventCateringSessions.eventId, eventId)))
      .orderBy(asc(eventCateringSessions.sortOrder), asc(eventCateringSessions.name)),
    db
      .select({ id: menuCategories.id, name: menuCategories.name })
      .from(menuCategories)
      .where(and(eq(menuCategories.orgId, orgId), eq(menuCategories.active, true)))
      .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name)),
    db
      .select({
        key: dietaryProfiles.key,
        label: dietaryProfiles.label,
        isAllergen: dietaryProfiles.isAllergen,
      })
      .from(dietaryProfiles)
      .where(and(eq(dietaryProfiles.orgId, orgId), eq(dietaryProfiles.active, true)))
      .orderBy(asc(dietaryProfiles.sortOrder), asc(dietaryProfiles.label)),
    db
      .select({
        id: cateringSessions.id,
        name: cateringSessions.name,
        startTime: cateringSessions.startTime,
        endTime: cateringSessions.endTime,
      })
      .from(cateringSessions)
      .where(and(eq(cateringSessions.orgId, orgId), eq(cateringSessions.active, true)))
      .orderBy(asc(cateringSessions.sortOrder), asc(cateringSessions.name)),
  ])

  const sessionIds = sessions.map((row) => row.id)
  const templateIds = [...new Set(sessions.map((row) => row.templateId).filter(Boolean) as string[])]

  const [items, rules, counts, assigned] = await Promise.all([
    sessionIds.length
      ? db
          .select({
            id: sessionMenuItems.id,
            eventSessionId: sessionMenuItems.eventSessionId,
            itemId: sessionMenuItems.itemId,
            categoryId: sessionMenuItems.categoryId,
            name: sessionMenuItems.nameSnapshot,
            unitClass: sessionMenuItems.unitClassSnapshot,
            unitPricePaise: sessionMenuItems.unitPricePaise,
            quantity: sessionMenuItems.quantity,
            dietary: sessionMenuItems.dietarySnapshot,
          })
          .from(sessionMenuItems)
          .where(
            and(
              eq(sessionMenuItems.orgId, orgId),
              inArray(sessionMenuItems.eventSessionId, sessionIds),
            ),
          )
          .orderBy(asc(sessionMenuItems.createdAt))
      : [],
    templateIds.length
      ? db
          .select({
            sessionId: categorySelectionRules.sessionId,
            categoryId: categorySelectionRules.categoryId,
            minSelections: categorySelectionRules.minSelections,
            maxSelections: categorySelectionRules.maxSelections,
            required: categorySelectionRules.required,
            pricingMode: categorySelectionRules.pricingMode,
          })
          .from(categorySelectionRules)
          .where(
            and(
              eq(categorySelectionRules.orgId, orgId),
              inArray(categorySelectionRules.sessionId, templateIds),
            ),
          )
      : [],
    sessionIds.length
      ? db
          .select({
            eventSessionId: sessionDietaryCounts.eventSessionId,
            profileKey: sessionDietaryCounts.profileKey,
            count: sessionDietaryCounts.count,
          })
          .from(sessionDietaryCounts)
          .where(
            and(
              eq(sessionDietaryCounts.orgId, orgId),
              inArray(sessionDietaryCounts.eventSessionId, sessionIds),
            ),
          )
      : [],
    db
      .select({
        categoryId: menuItemCategories.categoryId,
        id: serviceItems.id,
        name: serviceItems.name,
        pricePaise: serviceItems.pricePaise,
        unitClass: serviceItems.unitClass,
        dietary: serviceItems.dietary,
      })
      .from(menuItemCategories)
      .innerJoin(serviceItems, eq(serviceItems.id, menuItemCategories.itemId))
      .where(
        and(
          eq(menuItemCategories.orgId, orgId),
          eq(serviceItems.active, true),
        ),
      )
      .orderBy(asc(serviceItems.name)),
  ])

  const itemsBySession = new Map<string, EventSessionItemView[]>()
  for (const item of items) {
    const list = itemsBySession.get(item.eventSessionId) ?? []
    list.push({
      id: item.id,
      itemId: item.itemId,
      categoryId: item.categoryId,
      name: item.name,
      unitClass: item.unitClass as UnitClass,
      unitPricePaise: item.unitPricePaise,
      quantity: item.quantity,
      dietary: item.dietary,
    })
    itemsBySession.set(item.eventSessionId, list)
  }

  const countsBySession = new Map<string, Record<string, number>>()
  for (const row of counts) {
    const map = countsBySession.get(row.eventSessionId) ?? {}
    map[row.profileKey] = row.count
    countsBySession.set(row.eventSessionId, map)
  }

  const rulesBySession: Record<string, RuleView[]> = {}
  for (const session of sessions) {
    const own = session.templateId ? rules.filter((r) => r.sessionId === session.templateId) : []
    const forSession = own.length
      ? own
      : categories.map((category) => ({
          sessionId: session.id,
          categoryId: category.id,
          minSelections: 0,
          maxSelections: null,
          required: false,
          pricingMode: 'per_guest',
        }))
    rulesBySession[session.id] = forSession.map((row) => ({
      categoryId: row.categoryId,
      rule: {
        minSelections: row.minSelections,
        maxSelections: row.maxSelections,
        required: row.required,
      },
      pricingMode: row.pricingMode,
    }))
  }

  const dishesByCategory: Record<string, DishView[]> = {}
  for (const dish of assigned) {
    const list = dishesByCategory[dish.categoryId] ?? []
    list.push({
      id: dish.id,
      name: dish.name,
      pricePaise: dish.pricePaise,
      unitClass: dish.unitClass as UnitClass,
      dietary: dish.dietary,
    })
    dishesByCategory[dish.categoryId] = list
  }

  const sessionViews: EventSessionView[] = sessions.map((session) => {
    const sessionItems = itemsBySession.get(session.id) ?? []
    const totals = sessionTotals({
      guests: session.guestCount,
      lines: sessionItems.map((item) => ({
        id: item.id,
        label: item.name,
        unitClass: item.unitClass,
        unitPricePaise: item.unitPricePaise,
        quantity: item.quantity,
        dietary: item.dietary,
      })),
    })
    return {
      ...session,
      items: sessionItems,
      totals,
      dietaryCounts: countsBySession.get(session.id) ?? {},
    }
  })

  const totals = eventCateringTotals(sessionViews.map((session) => session.totals))

  return {
    event: { ...event, guests: event.guests ?? 0 },
    sessions: sessionViews,
    categories,
    rulesBySession,
    dishesByCategory,
    diets,
    templates,
    totals,
    production: await buildProduction(orgId, sessionViews),
  }
}

/** Ingredient demand across every session, using each session's own guest count. */
async function buildProduction(
  orgId: string,
  sessions: readonly EventSessionView[],
): Promise<IngredientDemand[]> {
  const itemIds = [...new Set(sessions.flatMap((s) => s.items.map((i) => i.itemId)).filter(Boolean))] as string[]
  if (itemIds.length === 0) return []

  const db = getDb()
  const recipes = await db
    .select({
      itemId: menuItemIngredients.itemId,
      name: menuItemIngredients.name,
      unit: menuItemIngredients.unit,
      quantityMilliPerServing: menuItemIngredients.quantityMilliPerServing,
      wastageBp: menuItemIngredients.wastageBp,
    })
    .from(menuItemIngredients)
    .where(and(eq(menuItemIngredients.orgId, orgId), inArray(menuItemIngredients.itemId, itemIds)))

  const rows: (RecipeRowWithServings)[] = []
  for (const session of sessions) {
    for (const item of session.items) {
      if (!item.itemId) continue
      const servings = item.unitClass === 'PER_GUEST' ? session.guestCount : item.quantity
      for (const recipe of recipes.filter((row) => row.itemId === item.itemId)) {
        rows.push({
          name: recipe.name,
          unit: recipe.unit as IngredientUnit,
          quantityMilliPerServing: recipe.quantityMilliPerServing,
          wastageBp: recipe.wastageBp,
          servings,
        })
      }
    }
  }

  return aggregateIngredients(rows)
}

type RecipeRowWithServings = Parameters<typeof aggregateIngredients>[0][number]
