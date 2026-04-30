export type HouseholdRole = "eier" | "medlem"

export interface HouseholdMemberDto {
  userId: number
  brukernavn: string
  email: string
  rolle: HouseholdRole
  erMeg: boolean
}

export interface HouseholdPlacementDto {
  id: number
  plassering: string
}

export interface HouseholdSummaryDto {
  id: number
  navn: string
  minRolle: HouseholdRole
}

export interface ActiveInviteDto {
  code: string
  expiresAt: string
}

export interface HouseholdContextResponse {
  household: HouseholdSummaryDto | null
  medlemmer: HouseholdMemberDto[]
  plasseringer: HouseholdPlacementDto[]
  activeInvite: ActiveInviteDto | null
}

export interface CreateHouseholdResponse {
  message: string
  id: number
  navn: string
}

export interface MessageResponse {
  message: string
}
