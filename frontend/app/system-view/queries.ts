import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"
import type { HouseholdContextResponse } from "~/features/household/types"
import type { RecipeCategoryDto, RecipeDto } from "~/features/recipes/types"

import type {
  ConsumptionRowDto,
  HiddenRecipeDto,
  InventoryRowDto,
  ProductDto,
  ProductTypeDto,
  RecommendedRecipeDto,
  ShoppingListDto,
  UnitDto,
} from "./types"

// All query keys for system-view live under the "sv" namespace so they don't
// collide with the rest of the app and can be invalidated together if needed.
export const systemViewKeys = {
  units: ["sv", "units"] as const,
  productTypes: ["sv", "product-types"] as const,
  products: ["sv", "products"] as const,
  inventory: ["sv", "inventory"] as const,
  household: ["sv", "household"] as const,
  shoppingList: ["sv", "shopping-list"] as const,
  consumption: ["sv", "consumption"] as const,
  recipes: ["sv", "recipes"] as const,
  recipeCategories: ["sv", "recipe-categories"] as const,
  recommendedRecipes: ["sv", "recommended-recipes"] as const,
  hiddenRecipes: ["sv", "hidden-recipes"] as const,
}

export function useSvUnits() {
  return useQuery({
    queryKey: systemViewKeys.units,
    queryFn: () => apiFetch<UnitDto[]>("/api/maaleenheter"),
    staleTime: 1000 * 60 * 30,
  })
}

export function useSvProductTypes() {
  return useQuery({
    queryKey: systemViewKeys.productTypes,
    queryFn: () => apiFetch<ProductTypeDto[]>("/api/varetyper"),
    staleTime: 1000 * 60 * 30,
  })
}

export function useSvProducts() {
  return useQuery({
    queryKey: systemViewKeys.products,
    queryFn: () => apiFetch<ProductDto[]>("/api/varer"),
  })
}

export function useSvInventory() {
  return useQuery({
    queryKey: systemViewKeys.inventory,
    queryFn: () => apiFetch<InventoryRowDto[]>("/api/varelager"),
  })
}

export function useSvHousehold() {
  return useQuery({
    queryKey: systemViewKeys.household,
    queryFn: () => apiFetch<HouseholdContextResponse>("/api/husholdning"),
  })
}

export function useSvShoppingList() {
  return useQuery({
    queryKey: systemViewKeys.shoppingList,
    queryFn: () => apiFetch<ShoppingListDto>("/api/handleliste"),
  })
}

export function useSvConsumption() {
  return useQuery({
    queryKey: systemViewKeys.consumption,
    queryFn: () => apiFetch<ConsumptionRowDto[]>("/api/forbruk"),
  })
}

export function useSvRecipes() {
  return useQuery({
    queryKey: systemViewKeys.recipes,
    queryFn: () => apiFetch<RecipeDto[]>("/api/oppskrifter"),
  })
}

export function useSvRecipeCategories() {
  return useQuery({
    queryKey: systemViewKeys.recipeCategories,
    queryFn: () => apiFetch<RecipeCategoryDto[]>("/api/oppskriftskategorier"),
    staleTime: 1000 * 60 * 30,
  })
}

export function useSvRecommendedRecipes() {
  return useQuery({
    queryKey: systemViewKeys.recommendedRecipes,
    queryFn: () => apiFetch<RecommendedRecipeDto[]>("/api/oppskrifteranbefalt"),
  })
}

export function useSvHiddenRecipes() {
  return useQuery({
    queryKey: systemViewKeys.hiddenRecipes,
    queryFn: () => apiFetch<HiddenRecipeDto[]>("/api/oppskrifter/skjulte"),
  })
}
