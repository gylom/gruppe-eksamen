import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { ShoppingListCompletionSummary } from "./types"

export function useShoppingCompletionPreview(enabled: boolean) {
  return useQuery({
    queryKey: ["shopping-list", "completion-preview"],
    queryFn: () =>
      apiFetch<ShoppingListCompletionSummary>("/api/handleliste/completion-preview"),
    enabled,
  })
}
