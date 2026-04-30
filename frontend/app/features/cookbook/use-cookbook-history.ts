import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { CookbookHistoryResponse, CookbookSortMode } from "./types"

export type CookbookHistoryFilters = {
  search: string | null
  mealTypeId: number | null
  sort: CookbookSortMode
}

/** Stable prefix so shopping completion can invalidate `["cookbook"]`. */
export function cookbookQueryKey(filters: CookbookHistoryFilters) {
  return ["cookbook", filters.search ?? "", filters.mealTypeId ?? null, filters.sort] as const
}

function buildCookbookPath(filters: CookbookHistoryFilters): string {
  const params = new URLSearchParams()
  const q = filters.search?.trim()
  if (q) params.set("search", q)
  if (filters.mealTypeId != null) params.set("mealTypeId", String(filters.mealTypeId))
  params.set("sort", filters.sort)
  const suffix = params.toString()
  return suffix ? `/api/cookbook?${suffix}` : `/api/cookbook?sort=${encodeURIComponent(filters.sort)}`
}

export function useCookbookHistory(filters: CookbookHistoryFilters) {
  return useQuery({
    queryKey: cookbookQueryKey(filters),
    queryFn: () => apiFetch<CookbookHistoryResponse>(buildCookbookPath(filters)),
  })
}
