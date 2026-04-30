/** Meal-type category ids shown in weekly planning (v1). Order = row display order. */
export const PLANNING_MEAL_TYPE_ORDER = [1, 2, 3, 7, 8] as const

export const PLANNING_MEAL_TYPE_IDS = new Set<number>(PLANNING_MEAL_TYPE_ORDER)

export function sortPlanningCategories<T extends { id: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ia = PLANNING_MEAL_TYPE_ORDER.indexOf(a.id as (typeof PLANNING_MEAL_TYPE_ORDER)[number])
    const ib = PLANNING_MEAL_TYPE_ORDER.indexOf(b.id as (typeof PLANNING_MEAL_TYPE_ORDER)[number])
    const ra = ia === -1 ? 999 : ia
    const rb = ib === -1 ? 999 : ib
    return ra - rb
  })
}

/** Labels until `/api/oppskriftskategorier` has loaded */
export const PLANNING_MEAL_FALLBACK_NAVN: Record<number, string> = {
  1: "Frokost",
  2: "Lunsj",
  3: "Middag",
  7: "Kveldsmat",
  8: "Mellommåltid",
}
