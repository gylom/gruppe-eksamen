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
  bilde: string | null
  kategoriId: number | null
  kategori: string | null
}

export interface CookbookHistoryResponse {
  items: CookbookHistoryItem[]
}
