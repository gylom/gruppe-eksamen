// DTOs used by /system-view. These mirror the backend JSON shapes consumed in
// client-react/src/App.jsx and are intentionally permissive (lots of optionals)
// because the dashboard surfaces raw data across many endpoints.

export interface ProductTypeDto {
  id: number
  varetype: string
}

export interface UnitDto {
  id: number
  enhet: string
  type?: string | null
}

export interface ProductDto {
  id: number
  varenavn: string
  varetypeId?: number | null
  varetype?: string | null
  merke?: string | null
  kvantitet?: number | null
  maaleenhetId?: number | null
  maaleenhet?: string | null
  ean?: string | null
  hovedkategori?: string | null
  kategori?: string | null
}

export interface InventoryItemDto {
  id: number
  vareId: number
  kvantitet: number | null
  maaleenhet?: string | null
  kjopsdato?: string | null
  bestfordato?: string | null
  plassering?: string | null
  plasseringId?: number | null
}

export interface InventoryRowDto {
  varetype_id: number
  varetype: string
  varenavn: string
  total_kvantitet: number | null
  maaleenhet?: string | null
  minimumslager?: number | null
  beredskapslager?: boolean | null
  plasseringer?: string[] | null
  varer?: InventoryItemDto[] | null
}

export interface ConsumptionRowDto {
  id: number
  forbruksdato?: string | null
  varenavn?: string | null
  varetype?: string | null
  kvantitet?: number | null
  maaleenhet?: string | null
  brukernavn?: string | null
}

export interface ShoppingItemDto {
  id: number
  varetype: string
  varenavn?: string | null
  kvantitet?: number | null
  maaleenhet?: string | null
  brukernavn?: string | null
}

export interface ShoppingSuggestionDto {
  varetypeId: number
  varetype: string
  forslagKvantitet: number
  begrunnelse: string
}

export interface ShoppingListDto {
  varer: ShoppingItemDto[]
  forslag: ShoppingSuggestionDto[]
}

export interface RecipeIngredientFormRow {
  productTypeId: string
  quantity: string
  measurementUnitId: string
  type: string
  optional: boolean
}

export interface RecommendedRecipeDto {
  id: number
  navn: string
  matchProsent: number
  karakter: number | null
  kategori?: string | null
  bilde?: string | null
  porsjoner?: number | null
}

export interface HiddenRecipeDto {
  id: number
  navn: string
  karakter: number | null
  skjultBegrunnelse?: string | null
}
