import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { ConfirmShoppingSuggestionsBody, ConfirmShoppingSuggestionsResponse } from "./types"

export type ConfirmShoppingSuggestionsVars = ConfirmShoppingSuggestionsBody

export function useConfirmShoppingSuggestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: ConfirmShoppingSuggestionsVars) =>
      apiFetch<ConfirmShoppingSuggestionsResponse>("/api/handleliste/confirm-suggestions", {
        method: "POST",
        body: {
          weekStartDate: vars.weekStartDate,
          selectedClientIds: vars.selectedClientIds,
        } satisfies ConfirmShoppingSuggestionsBody,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shopping-list"] })
    },
  })
}
