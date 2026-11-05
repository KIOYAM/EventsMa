import { and, asc, eq } from 'drizzle-orm'
import { getDb } from './client'
import { serviceItems } from './schema'
import { menuCategories, menuItemCategories, menuItemIngredients } from './schema-catering'

/** Dishes, the categories they belong to, and their recipe rows. */

export interface RecipeRowView {
  id: string
  name: string
  unit: string
  quantityMilliPerServing: number
  wastageBp: number
}

export interface RecipeDishView {
  id: string
  name: string
  pricePaise: number
  unitClass: string
  categoryIds: string[]
  ingredients: RecipeRowView[]
}

export interface RecipesBoard {
  dishes: RecipeDishView[]
  categories: { id: string; name: string }[]
}

export async function getRecipesBoard(orgId: string, demo: boolean): Promise<RecipesBoard> {
  if (demo) return { dishes: [], categories: [] }

  const db = getDb()

  const [dishes, categories, assignments, ingredients] = await Promise.all([
    db
      .select({
        id: serviceItems.id,
        name: serviceItems.name,
        pricePaise: serviceItems.pricePaise,
        unitClass: serviceItems.unitClass,
      })
      .from(serviceItems)
      .where(and(eq(serviceItems.orgId, orgId), eq(serviceItems.active, true)))
      .orderBy(asc(serviceItems.name)),
    db
      .select({ id: menuCategories.id, name: menuCategories.name })
      .from(menuCategories)
      .where(and(eq(menuCategories.orgId, orgId), eq(menuCategories.active, true)))
      .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name)),
    db
      .select({ itemId: menuItemCategories.itemId, categoryId: menuItemCategories.categoryId })
      .from(menuItemCategories)
      .where(eq(menuItemCategories.orgId, orgId)),
    db
      .select({
        id: menuItemIngredients.id,
        itemId: menuItemIngredients.itemId,
        name: menuItemIngredients.name,
        unit: menuItemIngredients.unit,
        quantityMilliPerServing: menuItemIngredients.quantityMilliPerServing,
        wastageBp: menuItemIngredients.wastageBp,
      })
      .from(menuItemIngredients)
      .where(eq(menuItemIngredients.orgId, orgId))
      .orderBy(asc(menuItemIngredients.sortOrder), asc(menuItemIngredients.name)),
  ])

  return {
    categories,
    dishes: dishes.map((dish) => ({
      ...dish,
      categoryIds: assignments.filter((row) => row.itemId === dish.id).map((row) => row.categoryId),
      ingredients: ingredients
        .filter((row) => row.itemId === dish.id)
        .map(({ itemId: _itemId, ...rest }) => rest),
    })),
  }
}
