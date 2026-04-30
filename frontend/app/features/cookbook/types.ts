export type CookbookSortMode = "ratingThenRecent" | "recent"

export interface CookbookHistoryItem {
  recipeId: number
  recipeName: string
  mealTypeId: number
  mealType: string
  cookedCount: number
  lastCookedAt: string
  currentUserRating: number | null
  recipePortions: number
}

export interface CookbookHistoryResponse {
  items: CookbookHistoryItem[]
}
