import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { UpdateShoppingItemBody, UpdateShoppingItemResponse } from "./types"

export function useUpdateShoppingItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { id: number; body: UpdateShoppingItemBody }) =>
      apiFetch<UpdateShoppingItemResponse>(`/api/handleliste/${vars.id}`, {
        method: "PUT",
        body: vars.body,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shopping-list"] })
    },
  })
}
