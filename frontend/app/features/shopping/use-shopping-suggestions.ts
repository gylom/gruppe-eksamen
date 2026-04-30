import { useMutation } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { GenerateShoppingSuggestionsBody, GenerateShoppingSuggestionsResponse } from "./types"

export type GenerateShoppingSuggestionsVars = GenerateShoppingSuggestionsBody

/**
 * Read-only POST: transient suggestion rows for a week. Does not mutate the shopping list or plan cache.
 */
export function useGenerateShoppingSuggestions() {
  return useMutation({
    mutationFn: (vars: GenerateShoppingSuggestionsVars) =>
      apiFetch<GenerateShoppingSuggestionsResponse>("/api/handleliste/generate-from-week", {
        method: "POST",
        body: { weekStartDate: vars.weekStartDate } satisfies GenerateShoppingSuggestionsBody,
      }),
  })
}
