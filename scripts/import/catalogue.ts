/**
 * Catalogue rows: menu periods and groups, dishes and decor/photo/makeup items,
 * packages, recipes and the decor material and artist libraries.
 *
 * Idempotent by natural key. An item that already exists is left alone apart
 * from missing section/group links, so re-running the importer after an owner has
 * edited a price does not undo that edit.
 */
import { ITEMS_BY_VERTICAL, MATERIALS, MENU_SECTIONS, PACKAGES, RECIPES, ARTISTS } from './catalogue-content'
import type { Sql } from './context'
import { jsonOf } from './context'

export interface CatalogueCounts {
  items: number
  packages: number
  recipes: number
  materials: number
  artists: number
}

async function ensureMenu(sql: Sql, orgId: string): Promise<{
  section: Map<string, string>
  group: Map<string, string>
}> {
  const section = new Map<string, string>()
  const group = new Map<string, string>()

  for (const [index, spec] of MENU_SECTIONS.entries()) {
    const [existing] = await sql`
      select id from menu_sections where org_id = ${orgId} and name = ${spec.name} limit 1
    `
    let id = existing?.id as string | undefined
    if (!id) {
      const [row] = await sql`
        insert into menu_sections (org_id, name, window_start, window_end, sort_order, active)
        values (${orgId}, ${spec.name}, ${spec.start}, ${spec.end}, ${index}, true)
        returning id
      `
      id = row?.id
    }
    if (!id) continue
    section.set(spec.name, id)

    for (const [groupIndex, name] of spec.groups.entries()) {
      const [found] = await sql`
        select id from menu_groups
        where org_id = ${orgId} and section_id = ${id} and name = ${name}
        limit 1
      `
      let groupId = found?.id as string | undefined
      if (!groupId) {
        const [row] = await sql`
          insert into menu_groups (org_id, section_id, name, sort_order, active)
          values (${orgId}, ${id}, ${name}, ${groupIndex}, true)
          returning id
        `
        groupId = row?.id
      }
      if (groupId) group.set(`${spec.name}:${name}`, groupId)
    }
  }

  return { section, group }
}

async function ensureCategory(sql: Sql, orgId: string, name: string, sortOrder: number): Promise<string> {
  const [existing] = await sql`
    select id from menu_categories where org_id = ${orgId} and name = ${name} limit 1
  `
  if (existing) return String(existing.id)
  const [row] = await sql`
    insert into menu_categories (org_id, name, sort_order, active)
    values (${orgId}, ${name}, ${sortOrder}, true)
    on conflict (org_id, name) do nothing
    returning id
  `
  if (row) return String(row.id)
  const [again] = await sql`
    select id from menu_categories where org_id = ${orgId} and name = ${name} limit 1
  `
  return String(again?.id)
}

async function importItems(
  sql: Sql,
  orgId: string,
  menu: { section: Map<string, string>; group: Map<string, string> },
): Promise<number> {
  const json = jsonOf(sql)
  let added = 0
  const categoryIds = new Map<string, string>()
  let categoryOrder = 0

  for (const [vertical, items] of Object.entries(ITEMS_BY_VERTICAL)) {
    for (const [index, item] of items.entries()) {
      const [existing] = await sql`
        select id from service_items
        where org_id = ${orgId} and vertical_key = ${vertical} and name = ${item.name}
        limit 1
      `
      let itemId = existing?.id as string | undefined

      if (!itemId) {
        const [row] = await sql`
          insert into service_items
            (org_id, vertical_key, name, category, unit_class, unit_label, price_paise,
             cost_paise, tax_rate_bp, description, dietary, section_id, group_id, sort_order, active)
          values
            (${orgId}, ${vertical}, ${item.name}, ${item.category}, ${item.unit}::unit_class,
             ${item.label}, ${item.price}, ${item.cost},
             ${vertical === 'catering' ? 500 : 1800},
             ${item.description ?? null}, ${item.diet ?? null},
             ${item.section ? (menu.section.get(item.section) ?? null) : null}::uuid,
             ${item.section && item.group ? (menu.group.get(`${item.section}:${item.group}`) ?? null) : null}::uuid,
             ${index}, true)
          returning id
        `
        itemId = row?.id
        added += 1
      } else {
        // Keep the imported catalogue deterministic: the content file is the
        // source for these fields, so a corrected unit or price reaches the row
        // on the next run instead of needing a manual edit.
        await sql`
          update service_items set
            category = ${item.category},
            unit_class = ${item.unit}::unit_class,
            unit_label = ${item.label},
            price_paise = ${item.price},
            cost_paise = ${item.cost},
            tax_rate_bp = ${vertical === 'catering' ? 500 : 1800},
            description = ${item.description ?? null},
            dietary = ${item.diet ?? null},
            section_id = coalesce(section_id, ${item.section ? (menu.section.get(item.section) ?? null) : null}::uuid),
            group_id = coalesce(group_id, ${item.section && item.group ? (menu.group.get(`${item.section}:${item.group}`) ?? null) : null}::uuid),
            updated_at = now()
          where id = ${itemId}
        `
      }
      if (!itemId) continue

      if (vertical === 'catering') {
        if (!categoryIds.has(item.category)) {
          const id = await ensureCategory(sql, orgId, item.category, categoryOrder++)
          categoryIds.set(item.category, id)
        }
        const categoryId = categoryIds.get(item.category)
        if (categoryId) {
          await sql`
            insert into menu_item_categories (org_id, item_id, category_id)
            values (${orgId}, ${itemId}, ${categoryId})
            on conflict (item_id, category_id) do nothing
          `
        }
      }
    }
  }

  // attrs stays an empty object, as the app writes it; kept explicit so a future
  // vertical-specific attribute has an obvious home.
  await sql`
    update service_items set attrs = ${json({})}
    where org_id = ${orgId} and attrs is null
  `
  return added
}

async function importPackages(sql: Sql, orgId: string): Promise<number> {
  let added = 0
  for (const pack of PACKAGES) {
    const [existing] = await sql`
      select id from service_packages
      where org_id = ${orgId} and vertical_key = ${pack.vertical} and name = ${pack.name}
      limit 1
    `
    if (existing) continue
    await sql`
      insert into service_packages
        (org_id, vertical_key, name, unit_class, rate_paise, min_quantity, tax_rate_bp, inclusions, active)
      values
        (${orgId}, ${pack.vertical}, ${pack.name}, ${pack.unit}::unit_class, ${pack.rate},
         ${pack.minQuantity}, ${pack.vertical === 'catering' ? 500 : 1800}, ${pack.inclusions}, true)
    `
    added += 1
  }
  return added
}

async function importRecipes(sql: Sql, orgId: string): Promise<number> {
  let added = 0
  const inventory = await sql`
    select id, name from inventory_items where org_id = ${orgId}
  `
  const inventoryByName = new Map(inventory.map((row) => [String(row.name), String(row.id)]))

  for (const recipe of RECIPES) {
    const [item] = await sql`
      select id from service_items
      where org_id = ${orgId} and vertical_key = 'catering' and name = ${recipe.item}
      limit 1
    `
    if (!item) continue

    for (const [index, line] of recipe.ingredients.entries()) {
      const [existing] = await sql`
        select id from menu_item_ingredients
        where org_id = ${orgId} and item_id = ${item.id} and name = ${line.name}
        limit 1
      `
      if (existing) continue
      await sql`
        insert into menu_item_ingredients
          (org_id, item_id, inventory_item_id, name, quantity_milli_per_serving, unit, wastage_bp, sort_order)
        values
          (${orgId}, ${item.id}, ${inventoryByName.get(line.name) ?? null}, ${line.name},
           ${line.quantityMilliPerServing}, ${line.unit}, ${line.wastageBp}, ${index})
      `
      added += 1
    }
  }
  return added
}

async function importMaterials(sql: Sql, orgId: string): Promise<number> {
  let added = 0
  for (const [index, material] of MATERIALS.entries()) {
    const [existing] = await sql`
      select id from decoration_materials where org_id = ${orgId} and name = ${material.name} limit 1
    `
    if (existing) continue
    await sql`
      insert into decoration_materials
        (org_id, name, category, unit, quantity_available, quantity_unit,
         cost_paise_per_unit, supplier, sort_order, active)
      values
        (${orgId}, ${material.name}, ${material.category}, ${material.unit},
         ${material.quantity}, ${material.quantityUnit}, ${material.costPaise},
         ${material.supplier}, ${index}, true)
    `
    added += 1
  }
  return added
}

async function importArtists(sql: Sql, orgId: string): Promise<number> {
  let added = 0
  for (const artist of ARTISTS) {
    const [existing] = await sql`
      select id from makeup_artists where org_id = ${orgId} and name = ${artist.name} limit 1
    `
    if (existing) continue
    await sql`
      insert into makeup_artists
        (org_id, name, phone, email, skills, specializations, rate_paise_per_hour,
         travel_fee_paise, active)
      values
        (${orgId}, ${artist.name}, ${artist.phone}, ${artist.email}, ${artist.skills},
         ${artist.specializations}, ${artist.ratePaisePerHour}, ${artist.travelFeePaise}, true)
    `
    added += 1
  }
  return added
}

export async function importCatalogue(sql: Sql, orgId: string): Promise<CatalogueCounts> {
  const menu = await ensureMenu(sql, orgId)
  const items = await importItems(sql, orgId, menu)
  const packages = await importPackages(sql, orgId)
  const recipes = await importRecipes(sql, orgId)
  const materials = await importMaterials(sql, orgId)
  const artists = await importArtists(sql, orgId)
  return { items, packages, recipes, materials, artists }
}
