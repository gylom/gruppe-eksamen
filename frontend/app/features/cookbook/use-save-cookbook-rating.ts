import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

/** Map stored `Skjuloppskrift.Karakter` (1–10) to 1–5 stars for UI; odd legacy values round to nearest star. */
export function backendKarakterToStars(karakter: number | null): number | null {
  if (karakter == null) return null
  const stars = Math.round(karakter / 2)
  return Math.min(5, Math.max(1, stars))
}

export function starsToBackendKarakter(stars: 1 | 2 | 3 | 4 | 5): number {
  return stars * 2
}

export type SaveCookbookRatingVariables = {
  recipeId: number
  stars: 1 | 2 | 3 | 4 | 5
}

type PreferenceResponse = {
  message: string
  karakter: number | null
  skjul: boolean
  kommentar: string | null
}

export function useSaveCookbookRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ recipeId, stars }: SaveCookbookRatingVariables) => {
      return apiFetch<PreferenceResponse>(`/api/oppskrifter/${recipeId}/preferanse`, {
        method: "PUT",
        body: { karakter: starsToBackendKarakter(stars), skjul: false },
      })
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cookbook"] }),
        queryClient.invalidateQueries({ queryKey: ["recipe", variables.recipeId] }),
        queryClient.invalidateQueries({ queryKey: ["recipes"] }),
      ])
    },
  })
}
