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
