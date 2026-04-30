/** Mirrors backend ShoppingSuggestionDto (camelCase JSON). Ids are JSON numbers for ulong fields. */
export type ShoppingSuggestionDto = {
  clientId: string
  varetypeId: number
  varetype: string
  kvantitet: number | null
  maaleenhetId: number | null
  maaleenhet: string | null
  /** Count of contributing recipe ingredient rows aggregated into this suggestion. */
  sourceCount: number
  plannedMealIds: number[]
  alreadyOnList: boolean
  selectedByDefault: boolean
}

export type ActiveShoppingListRow = {
  id: number
  varetypeId: number
  varetype: string
  vareId: number | null
  varenavn: string | null
  kvantitet: number | null
  maaleenhetId: number | null
  maaleenhet: string | null
  userId: number
  brukernavn: string
  kilde: string
  planlagtMaaltidId: number | null
  purchasedAt: string | null
  opprettet: string | null
  endret: string | null
}

export type ShoppingListStockSuggestion = {
  varetypeId: number
  varetype: string
  forslagKvantitet: number
  begrunnelse: string
}

export type ShoppingListGetResponse = {
  varer: ActiveShoppingListRow[]
  forslag: ShoppingListStockSuggestion[]
}

export type ShoppingListPurchasedResponse = {
  varer: ActiveShoppingListRow[]
}

export type ShoppingListCompletionSummary = {
  archiveRowCount: number
  cookbookMealCount: number
  remainingActiveRowCount: number
  archivedAt: string | null
}

export type PurchaseRestoreShoppingItemResponse = {
  message: string
  id: number
  purchasedAt: string | null
}

export type CreateShoppingItemBody = {
  varetypeId: number
  vareId?: number | null
  kvantitet?: number | null
  maaleenhetId?: number | null
}

export type UpdateShoppingItemBody = {
  varetypeId: number
  vareId: number | null
  kvantitet: number | null
  maaleenhetId: number | null
}

export type CreateShoppingItemResponse = {
  message: string
  id: number
}

export type UpdateShoppingItemResponse = {
  message: string
}

export type VaretypeLookupRow = {
  id: number
  varetype: string
  kategori_id: number | null
  kategori: string
}

export type MaaleenhetLookupRow = {
  id: number
  enhet: string
  type: string | null
}

export type GenerateShoppingSuggestionsResponse = {
  weekStartDate: string
  plannedMealCount: number
  suggestions: ShoppingSuggestionDto[]
}

export type GenerateShoppingSuggestionsBody = {
  weekStartDate: string
}

export type ConfirmShoppingSuggestionsBody = {
  weekStartDate: string
  selectedClientIds: string[]
}

export type ConfirmShoppingSuggestionsResponse = {
  weekStartDate: string
  requestedCount: number
  addedCount: number
  skippedAlreadyOnListCount: number
  addedIds: number[]
}
