import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { PurchaseRestoreShoppingItemResponse } from "./types"

export function usePurchaseShoppingItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<PurchaseRestoreShoppingItemResponse>(`/api/handleliste/${id}/purchase`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shopping-list"] })
      await queryClient.invalidateQueries({ queryKey: ["shopping-list", "purchased"] })
      await queryClient.invalidateQueries({ queryKey: ["shopping-list", "completion-preview"] })
    },
  })
}
