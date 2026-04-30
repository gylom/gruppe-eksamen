export interface PlannedMealDto {
  id: number
  weekStartDate: string
  day: number
  mealTypeId: number
  mealType: string
  oppskriftId: number
  oppskriftNavn: string
  servings: number
}

export interface CreatePlannedMealBody {
  oppskriftId: number
  weekStartDate: string
  day: number
  mealTypeId: number
  servings: number
}
