import { and, asc, eq, inArray } from 'drizzle-orm'
import type { DietaryKey, MenuBoard, MenuGroupView, MenuSectionView } from '@/lib/domain/menu'
import { demoMenu } from '@/lib/demo/menu'
import { getDb } from '@/lib/db/client'
import { menuGroups, menuSections, serviceItems } from '@/lib/db/schema'

/**
 * One read for the whole menu board: sections, groups and dishes in three
 * anchored queries. Groups and items are stitched in memory so the page never
 * issues a query per section (the N+1 the catalogue screen would otherwise grow).
 */
export async function getMenuBoard(orgId: string, demo: boolean): Promise<MenuBoard> {
  if (demo) return demoMenu

  const db = getDb()

  const sections = await db
    .select()
    .from(menuSections)
    .where(and(eq(menuSections.orgId, orgId), eq(menuSections.active, true)))
    .orderBy(asc(menuSections.sortOrder), asc(menuSections.name))

  if (sections.length === 0) return { sections: [], imageBytes: 0 }

  const sectionIds = sections.map((section) => section.id)

  const groups = await db
    .select()
    .from(menuGroups)
    .where(
      and(
        eq(menuGroups.orgId, orgId),
        eq(menuGroups.active, true),
        inArray(menuGroups.sectionId, sectionIds),
      ),
    )
    .orderBy(asc(menuGroups.sortOrder), asc(menuGroups.name))

  const groupIds = groups.map((group) => group.id)

  const items = groupIds.length
    ? await db
        .select({
          id: serviceItems.id,
          name: serviceItems.name,
          description: serviceItems.description,
          pricePaise: serviceItems.pricePaise,
          unitClass: serviceItems.unitClass,
          dietary: serviceItems.dietary,
          imagePath: serviceItems.imagePath,
          imageBytes: serviceItems.imageBytes,
          groupId: serviceItems.groupId,
        })
        .from(serviceItems)
        .where(
          and(
            eq(serviceItems.orgId, orgId),
            eq(serviceItems.active, true),
            inArray(serviceItems.groupId, groupIds),
          ),
        )
        .orderBy(asc(serviceItems.sortOrder), asc(serviceItems.name))
    : []

  const itemsByGroup = new Map<string, MenuGroupView['items']>()
  for (const item of items) {
    if (!item.groupId) continue
    const list = itemsByGroup.get(item.groupId) ?? []
    list.push({
      id: item.id,
      name: item.name,
      description: item.description,
      pricePaise: item.pricePaise,
      unitClass: item.unitClass,
      dietary: (item.dietary as DietaryKey | null) ?? null,
      imagePath: item.imagePath,
      imageBytes: item.imageBytes,
    })
    itemsByGroup.set(item.groupId, list)
  }

  const groupsBySection = new Map<string, MenuGroupView[]>()
  for (const group of groups) {
    const list = groupsBySection.get(group.sectionId) ?? []
    list.push({
      id: group.id,
      name: group.name,
      description: group.description,
      items: itemsByGroup.get(group.id) ?? [],
    })
    groupsBySection.set(group.sectionId, list)
  }

  const board: MenuSectionView[] = sections.map((section) => ({
    id: section.id,
    name: section.name,
    windowStart: section.windowStart,
    windowEnd: section.windowEnd,
    groups: groupsBySection.get(section.id) ?? [],
  }))

  return {
    sections: board,
    imageBytes: items.reduce((total, item) => total + item.imageBytes, 0),
  }
}
