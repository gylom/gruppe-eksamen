export interface RecipeIngredientDto {
  id: number
  varetype_id: number
  varetype: string
  kvantitet: number | null
  maaleenhet_id: number | null
  maaleenhet: string | null
  type: string | null
  valgfritt: boolean | null
}

export interface RecipeDto {
  id: number
  navn: string
  instruksjoner: string
  porsjoner: number
  bilde: string | null
  kategori_id: number | null
  kategori: string | null
  user_id: number
  karakter: number | null
  kommentar: string | null
  skjul: boolean
  skjultBegrunnelse: string | null
  ingredienser: RecipeIngredientDto[]
}

export interface RecipeCategoryDto {
  id: number
  navn: string
}
