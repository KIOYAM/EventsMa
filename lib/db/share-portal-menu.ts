import 'server-only'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { getSystemDb } from './client'
import { serviceItems } from './schema'
import {
  categorySelectionRules,
  eventCateringSessions,
  menuCategories,
  sessionMenuItems,
} from './schema-catering'
import type { MenuCategory, MenuDish, MenuSession } from '@/lib/domain/menu-selection'
import type { SelectionRule } from '@/lib/domain/catering'
import { isUnitClass } from '@/lib/domain/units'
import { localiseContent } from '@/lib/domain/translations'
import { loadCategoryTranslations, loadItemTranslations } from './content-translations'
import type { TranslationLocale } from './schema-translations'

/**
 * The customer-facing view of an event's catering plan.
 *
 * Reads the same rows the owner planned with: the event's sessions (each with its
 * own guest count), the dishes assigned to each session, and the selection rules
 * from the session's template. Four bounded queries stitched in memory — never one
 * query per session, category or dish.
 *
 * Returns [] when the event has no planned menu, so the portal can fall back to
 * the flat catalogue for links created before a menu existed.
 */

const NO_RULE: SelectionRule = { minSelections: 0, maxSelections: null, required: false }

export async function loadEventMenu(
  orgId: string,
  eventId: string,
  locale: TranslationLocale | null = null,
): Promise<MenuSession[]> {
  const db = getSystemDb()

  const sessions = await db
    .select({
      id: eventCateringSessions.id,
      templateId: eventCateringSessions.templateId,
      name: eventCateringSessions.name,
      startTime: eventCateringSessions.startTime,
      endTime: eventCateringSessions.endTime,
      guests: eventCateringSessions.guestCount,
      serviceStyle: eventCateringSessions.serviceStyle,
      status: eventCateringSessions.status,
    })
    .from(eventCateringSessions)
    .where(and(eq(eventCateringSessions.orgId, orgId), eq(eventCateringSessions.eventId, eventId)))
    .orderBy(asc(eventCateringSessions.sortOrder), asc(eventCateringSessions.name))
    .limit(24)

  if (sessions.length === 0) return []

  const plannerSessions = sessions.filter((session) => session.status !== 'cancelled')
  if (plannerSessions.length === 0) return []

  const sessionIds = plannerSessions.map((session) => session.id)
  const templateIds = [
    ...new Set(plannerSessions.map((session) => session.templateId).filter(Boolean) as string[]),
  ]

  const [items, rules, categories] = await Promise.all([
    db
      .select({
        eventSessionId: sessionMenuItems.eventSessionId,
        categoryId: sessionMenuItems.categoryId,
        id: sessionMenuItems.itemId,
        name: sessionMenuItems.nameSnapshot,
        description: serviceItems.description,
        imagePath: serviceItems.imagePath,
        pricePaise: sessionMenuItems.unitPricePaise,
        unitClass: sessionMenuItems.unitClassSnapshot,
        unitLabel: sessionMenuItems.unitSnapshot,
        dietary: sessionMenuItems.dietarySnapshot,
      })
      .from(sessionMenuItems)
      .leftJoin(serviceItems, eq(serviceItems.id, sessionMenuItems.itemId))
      .where(
        and(
          eq(sessionMenuItems.orgId, orgId),
          inArray(sessionMenuItems.eventSessionId, sessionIds),
        ),
      )
      .orderBy(asc(sessionMenuItems.createdAt))
      .limit(500),
    templateIds.length
      ? db
          .select({
            sessionId: categorySelectionRules.sessionId,
            categoryId: categorySelectionRules.categoryId,
            minSelections: categorySelectionRules.minSelections,
            maxSelections: categorySelectionRules.maxSelections,
            required: categorySelectionRules.required,
          })
          .from(categorySelectionRules)
          .where(
            and(
              eq(categorySelectionRules.orgId, orgId),
              inArray(categorySelectionRules.sessionId, templateIds),
            ),
          )
      : Promise.resolve([]),
    db
      .select({
        id: menuCategories.id,
        name: menuCategories.name,
        description: menuCategories.description,
        sortOrder: menuCategories.sortOrder,
      })
      .from(menuCategories)
      .where(and(eq(menuCategories.orgId, orgId), eq(menuCategories.active, true)))
      .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name)),
  ])

  const categoryMeta = new Map(categories.map((row) => [row.id, row]))

  // Content translations are additive: the dish ids and prices are the same rows,
  // only the words change. Two extra bounded queries, no query per dish.
  let itemTranslations = new Map<string, { name: string; description: string | null }>()
  let categoryTranslations = new Map<string, { name: string; description: string | null }>()
  if (locale) {
    const itemIds = items.map((row) => row.id).filter((id): id is string => Boolean(id))
    ;[itemTranslations, categoryTranslations] = await Promise.all([
      loadItemTranslations(db, orgId, locale, itemIds),
      loadCategoryTranslations(
        db,
        orgId,
        locale,
        categories.map((row) => row.id),
      ),
    ])
  }

  const dishesBySessionCategory = new Map<string, MenuDish[]>()
  for (const item of items) {
    if (!item.categoryId || !item.id) continue
    const key = `${item.eventSessionId}:${item.categoryId}`
    const bucket = dishesBySessionCategory.get(key) ?? []
    const content = localiseContent(
      { name: item.name, description: item.description ?? null },
      itemTranslations.get(item.id),
    )

    bucket.push({
      id: item.id,
      name: content.name,
      description: content.description,
      pricePaise: item.pricePaise,
      unitClass: isUnitClass(item.unitClass) ? item.unitClass : 'PER_GUEST',
      unitLabel: item.unitLabel ?? null,
      dietary: item.dietary ?? null,
      imagePath: item.imagePath ?? null,
    })
    dishesBySessionCategory.set(key, bucket)
  }

  const rulesBySession = new Map<string, Map<string, SelectionRule>>()
  for (const rule of rules) {
    const map = rulesBySession.get(rule.sessionId) ?? new Map<string, SelectionRule>()
    map.set(rule.categoryId, {
      minSelections: rule.minSelections,
      maxSelections: rule.maxSelections,
      required: rule.required,
    })
    rulesBySession.set(rule.sessionId, map)
  }

  const menu: MenuSession[] = []
  for (const session of plannerSessions) {
    const ruleMap = session.templateId ? rulesBySession.get(session.templateId) : undefined

    const sessionCategories: MenuCategory[] = []
    for (const category of categories) {
      const dishes = dishesBySessionCategory.get(`${session.id}:${category.id}`)
      if (!dishes || dishes.length === 0) continue
      const categoryContent = localiseContent(
        { name: category.name, description: category.description },
        categoryTranslations.get(category.id),
      )

      sessionCategories.push({
        id: category.id,
        name: categoryContent.name,
        description: categoryContent.description,
        rule: ruleMap?.get(category.id) ?? NO_RULE,
        dishes: dishes.sort((a, b) => a.name.localeCompare(b.name)),
      })
    }

    if (sessionCategories.length === 0) continue

    menu.push({
      id: session.id,
      name: session.name,
      startTime: session.startTime,
      endTime: session.endTime,
      guests: session.guests,
      serviceStyle: session.serviceStyle,
      categories: sessionCategories,
    })
  }

  // A category whose name is missing from the active list still rendered above
  // only because its dishes exist; guard against the (impossible) empty name.
  return menu.map((session) => ({
    ...session,
    categories: session.categories.filter((category) => categoryMeta.has(category.id)),
  }))
}
