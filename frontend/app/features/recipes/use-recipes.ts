import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { RecipeCategoryDto, RecipeDto } from "./types"

export type RecipeListFilters = {
  search: string | null
  kategoriId: number | null
}

export function useDebouncedValue(value: string, ms = 300): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return debounced
}

function buildRecipesPath(filters: RecipeListFilters): string {
  const params = new URLSearchParams()
  const q = filters.search?.trim()
  if (q) params.set("sok", q)
  if (filters.kategoriId != null) params.set("kategoriId", String(filters.kategoriId))
  const suffix = params.toString()
  return suffix ? `/api/oppskrifter?${suffix}` : "/api/oppskrifter"
}

export function useRecipes(filters: RecipeListFilters) {
  return useQuery({
    queryKey: ["recipes", filters] as const,
    queryFn: () => apiFetch<RecipeDto[]>(buildRecipesPath(filters)),
  })
}

export function useRecipe(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ["recipe", id] as const,
    queryFn: () => apiFetch<RecipeDto>(`/api/oppskrifter/${id}`),
    enabled: enabled && id != null,
  })
}

export function useRecipeCategories() {
  return useQuery({
    queryKey: ["recipe-categories"] as const,
    queryFn: () => apiFetch<RecipeCategoryDto[]>("/api/oppskriftskategorier"),
  })
}
