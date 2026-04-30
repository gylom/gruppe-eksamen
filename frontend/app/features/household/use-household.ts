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
  })
}

export function useCreateHousehold() {
  return useMutation({
    mutationFn: (body: { navn: string }) =>
      apiFetch<CreateHouseholdResponse>("/api/husholdning", {
        method: "POST",
        body,
      }),
  })
}

export function useJoinHousehold() {
  return useMutation({
    mutationFn: (body: { code: string }) =>
      apiFetch<MessageResponse>("/api/husholdning/join", {
        method: "POST",
        body: { code: body.code },
      }),
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
