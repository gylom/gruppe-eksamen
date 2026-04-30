import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { ShoppingListCompletionSummary } from "./types"

export function useCompleteShoppingTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      apiFetch<ShoppingListCompletionSummary>("/api/handleliste/complete", {
        method: "POST",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["shopping-list"] }),
        queryClient.invalidateQueries({ queryKey: ["shopping-list", "purchased"] }),
        queryClient.invalidateQueries({ queryKey: ["shopping-list", "completion-preview"] }),
        queryClient.invalidateQueries({ queryKey: ["cookbook"] }),
      ])
    },
  })
}
