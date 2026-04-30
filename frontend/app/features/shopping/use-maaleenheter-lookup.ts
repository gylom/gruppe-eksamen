import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { MaaleenhetLookupRow } from "./types"

export function useMaaleenheterLookup() {
  return useQuery({
    queryKey: ["maaleenheter"],
    queryFn: () => apiFetch<MaaleenhetLookupRow[]>("/api/maaleenheter"),
    staleTime: 1000 * 60 * 30,
  })
}
