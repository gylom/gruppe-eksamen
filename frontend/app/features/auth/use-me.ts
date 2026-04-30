import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "~/lib/api-fetch"
import { getToken } from "~/lib/auth"

import type { MeResponse } from "./types"

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/api/auth/me"),
    enabled: typeof window !== "undefined" && !!getToken(),
  })
}
