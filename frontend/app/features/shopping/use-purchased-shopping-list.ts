import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { ShoppingListPurchasedResponse } from "./types"

export function usePurchasedShoppingList(enabled: boolean) {
  return useQuery({
    queryKey: ["shopping-list", "purchased"],
    queryFn: () => apiFetch<ShoppingListPurchasedResponse>("/api/handleliste/purchased"),
    enabled,
  })
}
