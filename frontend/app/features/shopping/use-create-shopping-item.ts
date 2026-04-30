import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { CreateShoppingItemBody, CreateShoppingItemResponse } from "./types"

export function useCreateShoppingItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateShoppingItemBody) =>
      apiFetch<CreateShoppingItemResponse>("/api/handleliste", {
        method: "POST",
        body,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["shopping-list"] })
    },
  })
}
