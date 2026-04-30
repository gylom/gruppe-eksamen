export interface PlannedMealIngredientDto {
  id: number
  varetypeId: number
  varetype: string
  kvantitet: number | null
  maaleenhetId: number | null
  maaleenhet: string | null
  type: string | null
  valgfritt: boolean | null
  excluded: boolean
}

export interface PlannedMealDto {
  id: number
  weekStartDate: string
  day: number
  mealTypeId: number
  mealType: string
  oppskriftId: number
  oppskriftNavn: string
  servings: number
  ingredients: PlannedMealIngredientDto[]
}

export interface CreatePlannedMealBody {
  oppskriftId: number
  weekStartDate: string
  day: number
  mealTypeId: number
  servings: number
}
