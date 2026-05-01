import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import { systemViewKeys } from "./queries"

type Empty = Record<string, never>

function useInvalidate(keys: ReadonlyArray<readonly unknown[]>) {
  const queryClient = useQueryClient()
  return () => keys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }))
}

// Section 1: Household
export function useSvCreateHousehold() {
  const invalidate = useInvalidate([systemViewKeys.household, ["me"]])
  return useMutation({
    mutationFn: (body: { navn: string }) =>
      apiFetch<unknown>("/api/husholdning", { method: "POST", body }),
    onSuccess: invalidate,
  })
}

export function useSvRenameHousehold() {
  const invalidate = useInvalidate([systemViewKeys.household])
  return useMutation({
    mutationFn: (body: { navn: string }) =>
      apiFetch<unknown>("/api/husholdning", { method: "PUT", body }),
    onSuccess: invalidate,
  })
}

// Section 2: Members
export function useSvAddMember() {
  const invalidate = useInvalidate([systemViewKeys.household])
  return useMutation({
    mutationFn: (body: { brukernavnEllerEmail: string; rolle: string }) =>
      apiFetch<unknown>("/api/husholdning/medlemmer", { method: "POST", body }),
    onSuccess: invalidate,
  })
}

export function useSvRemoveMember() {
  const invalidate = useInvalidate([systemViewKeys.household])
  return useMutation({
    mutationFn: (memberUserId: number) =>
      apiFetch<unknown>(`/api/husholdning/medlemmer/${memberUserId}`, { method: "DELETE" }),
    onSuccess: invalidate,
  })
}

export function useSvLeaveHousehold() {
  const invalidate = useInvalidate([systemViewKeys.household, ["me"]])
  return useMutation({
    mutationFn: (_: Empty = {} as Empty) =>
      apiFetch<unknown>("/api/husholdning/leave", { method: "DELETE" }),
    onSuccess: invalidate,
  })
}

// Section 3: Placements
export function useSvAddPlacement() {
  const invalidate = useInvalidate([systemViewKeys.household])
  return useMutation({
    mutationFn: (body: { plassering: string }) =>
      apiFetch<unknown>("/api/husholdning/plassering", { method: "POST", body }),
    onSuccess: invalidate,
  })
}

export function useSvDeletePlacement() {
  const invalidate = useInvalidate([systemViewKeys.household])
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<unknown>(`/api/husholdning/plassering/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  })
}

// Section 4: Inventory settings (min stock + emergency)
export function useSvSaveInventorySettings() {
  const invalidate = useInvalidate([systemViewKeys.inventory, systemViewKeys.shoppingList])
  return useMutation({
    mutationFn: (body: {
      varetypeId: number
      minimumslager: number
      beredskapslager: boolean
    }) =>
      apiFetch<unknown>("/api/varelager/innstillinger", {
        method: "POST",
        body,
      }),
    onSuccess: invalidate,
  })
}

// Section 5: Inventory take-out
export function useSvTakeFromInventory() {
  const invalidate = useInvalidate([
    systemViewKeys.inventory,
    systemViewKeys.recommendedRecipes,
    systemViewKeys.consumption,
  ])
  return useMutation({
    mutationFn: ({ id, kvantitet }: { id: number; kvantitet: number }) =>
      apiFetch<unknown>(`/api/varelager/${id}/taut`, {
        method: "POST",
        body: { kvantitet },
      }),
    onSuccess: invalidate,
  })
}

// Section 6: Add to inventory
export interface AddInventoryBody {
  vareId: number
  kvantitet: number
  maaleenhetId: number | null
  kjopsdato: string | null
  bestfordato: string | null
  plasseringId: number | null
}

export function useSvAddInventoryItem() {
  const invalidate = useInvalidate([
    systemViewKeys.inventory,
    systemViewKeys.recommendedRecipes,
    systemViewKeys.consumption,
  ])
  return useMutation({
    mutationFn: (body: AddInventoryBody) =>
      apiFetch<unknown>("/api/varelager", { method: "POST", body }),
    onSuccess: invalidate,
  })
}

// Section 7: Shopping list
export interface AddShoppingItemBody {
  varetypeId: number
  vareId: number | null
  kvantitet: number | null
  maaleenhetId: number | null
}

export function useSvAddShoppingItem() {
  const invalidate = useInvalidate([systemViewKeys.shoppingList])
  return useMutation({
    mutationFn: (body: AddShoppingItemBody) =>
      apiFetch<unknown>("/api/handleliste", { method: "POST", body }),
    onSuccess: invalidate,
  })
}

export function useSvDeleteShoppingItem() {
  const invalidate = useInvalidate([systemViewKeys.shoppingList])
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<unknown>(`/api/handleliste/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  })
}

// Section 8: Consumption
export interface CreateConsumptionBody {
  varelagerId: number | null
  vareId: number | null
  kvantitet: number
  maaleenhetId: number | null
  forbruksdato: string | null
}

export function useSvCreateConsumption() {
  const invalidate = useInvalidate([
    systemViewKeys.consumption,
    systemViewKeys.inventory,
    systemViewKeys.recommendedRecipes,
  ])
  return useMutation({
    mutationFn: (body: CreateConsumptionBody) =>
      apiFetch<unknown>("/api/forbruk", { method: "POST", body }),
    onSuccess: invalidate,
  })
}

// Section 9: Recipes
export interface CreateRecipePayload {
  navn: string
  instruksjoner: string
  porsjoner: number
  kategoriId: number | null
  bilde: string | null
  ingredienser: Array<{
    varetypeId: number
    kvantitet: number
    maaleenhetId: number | null
    type: string
    valgfritt: boolean
  }>
}

export function useSvCreateRecipe() {
  const invalidate = useInvalidate([
    systemViewKeys.recipes,
    systemViewKeys.recommendedRecipes,
  ])
  return useMutation({
    mutationFn: (body: CreateRecipePayload) =>
      apiFetch<unknown>("/api/oppskrifter", { method: "POST", body }),
    onSuccess: invalidate,
  })
}

export function useSvSaveRecipePreference() {
  const invalidate = useInvalidate([
    systemViewKeys.recipes,
    systemViewKeys.recommendedRecipes,
    systemViewKeys.hiddenRecipes,
  ])
  return useMutation({
    mutationFn: ({
      recipeId,
      data,
    }: {
      recipeId: number
      data: { karakter?: number; skjul?: boolean }
    }) =>
      apiFetch<unknown>(`/api/oppskrifter/${recipeId}/preferanse`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: invalidate,
  })
}

export function useSvDeleteRecipe() {
  const invalidate = useInvalidate([
    systemViewKeys.recipes,
    systemViewKeys.recommendedRecipes,
    systemViewKeys.hiddenRecipes,
  ])
  return useMutation({
    mutationFn: (recipeId: number) =>
      apiFetch<unknown>(`/api/oppskrifter/${recipeId}`, { method: "DELETE" }),
    onSuccess: invalidate,
  })
}
