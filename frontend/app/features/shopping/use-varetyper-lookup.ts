import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"

import type { VaretypeLookupRow } from "./types"

export function useVaretyperLookup() {
  return useQuery({
    queryKey: ["varetyper"],
    queryFn: () => apiFetch<VaretypeLookupRow[]>("/api/varetyper"),
    staleTime: 1000 * 60 * 30,
  })
}
