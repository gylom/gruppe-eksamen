import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useMe } from "~/features/auth/use-me"
import { apiFetch } from "~/lib/api-fetch"
import { getToken } from "~/lib/auth"

import type { CreateHouseholdResponse, HouseholdContextResponse, MessageResponse } from "./types"

export function useHousehold() {
  const me = useMe()
  const hasHousehold = me.data?.householdId != null

  return useQuery({
    queryKey: ["household"],
    queryFn: () => apiFetch<HouseholdContextResponse>("/api/husholdning"),
    enabled: typeof window !== "undefined" && !!getToken() && hasHousehold,
    refetchInterval: (query) => {
      const data = query.state.data as HouseholdContextResponse | undefined
      const expiresAt = data?.activeInvite?.expiresAt
      if (!expiresAt) return false
      const msUntilExpiry = new Date(expiresAt).getTime() - Date.now()
      if (msUntilExpiry <= 0) return false
      // Refetch one minute before expiry, but no sooner than every 60s.
      return Math.max(60_000, msUntilExpiry - 60_000)
    },
  })
}

export function useCreateHousehold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { navn: string }) =>
      apiFetch<CreateHouseholdResponse>("/api/husholdning", {
        method: "POST",
        body,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      await queryClient.invalidateQueries({ queryKey: ["household"] })
    },
  })
}

export function useJoinHousehold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { code: string }) =>
      apiFetch<MessageResponse>("/api/husholdning/join", {
        method: "POST",
        body: { code: body.code },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      await queryClient.invalidateQueries({ queryKey: ["household"] })
    },
  })
}

export function useGenerateInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch<MessageResponse>("/api/husholdning/invitasjon", {
        method: "POST",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["household"] })
    },
  })
}

export function useRevokeInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      apiFetch<MessageResponse>("/api/husholdning/invitasjon", {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["household"] })
    },
  })
}
