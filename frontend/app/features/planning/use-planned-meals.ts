import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"
import { isMondayKey } from "~/lib/dates"

import type { CreatePlannedMealBody, PlannedMealDto } from "./types"

export function usePlannedMeals(weekStartDate: string | null) {
  return useQuery({
    queryKey: ["planned-meals", weekStartDate] as const,
    queryFn: () =>
      apiFetch<PlannedMealDto[]>(
        `/api/planlagte-maaltider?weekStartDate=${encodeURIComponent(weekStartDate!)}`,
      ),
    enabled: weekStartDate != null && isMondayKey(weekStartDate),
    placeholderData: keepPreviousData,
  })
}

export function useCreatePlannedMeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePlannedMealBody) =>
      apiFetch<PlannedMealDto>("/api/planlagte-maaltider", {
        method: "POST",
        body,
      }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["planned-meals", variables.weekStartDate],
      })
    },
  })
}

export type UpdatePlannedMealServingsVars = {
  id: number
  servings: number
  weekStartDate: string
}

export function useUpdatePlannedMealServings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, servings }: UpdatePlannedMealServingsVars) =>
      apiFetch<PlannedMealDto>(`/api/planlagte-maaltider/${id}/servings`, {
        method: "PUT",
        body: { servings },
      }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["planned-meals", variables.weekStartDate],
      })
    },
  })
}

export type PlannedMealIngredientMutationVars = {
  plannedMealId: number
  ingrediensId: number
  weekStartDate: string
}

export function useExcludePlannedMealIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ plannedMealId, ingrediensId }: PlannedMealIngredientMutationVars) =>
      apiFetch<PlannedMealDto>(`/api/planlagte-maaltider/${plannedMealId}/ekskluder`, {
        method: "POST",
        body: { ingrediensId },
      }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["planned-meals", variables.weekStartDate],
      })
    },
  })
}

export function useRestorePlannedMealIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ plannedMealId, ingrediensId }: PlannedMealIngredientMutationVars) =>
      apiFetch<PlannedMealDto>(
        `/api/planlagte-maaltider/${plannedMealId}/ekskluder/${ingrediensId}`,
        { method: "DELETE" },
      ),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["planned-meals", variables.weekStartDate],
      })
    },
  })
}

export type DeletePlannedMealVars = {
  id: number
  weekStartDate: string
}

export function useDeletePlannedMeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: DeletePlannedMealVars) =>
      apiFetch<null>(`/api/planlagte-maaltider/${id}`, { method: "DELETE" }),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["planned-meals", variables.weekStartDate],
        }),
        queryClient.invalidateQueries({ queryKey: ["shopping-list"] }),
        queryClient.invalidateQueries({
          queryKey: ["shopping-list", "purchased"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["shopping-list", "completion-preview"],
        }),
      ])
    },
  })
}
