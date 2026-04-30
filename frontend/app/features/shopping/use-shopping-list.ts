import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { ShoppingListGetResponse } from "./types"

export function useShoppingList() {
  return useQuery({
    queryKey: ["shopping-list"],
    queryFn: () => apiFetch<ShoppingListGetResponse>("/api/handleliste"),
  })
}
