export interface MeResponse {
  userId: number
  brukernavn: string
  email: string
  householdId: number | null
  householdName: string
  householdRole: "eier" | "medlem" | null
}

export interface AuthResponse {
  token: string
  userId: number
  brukernavn: string
  email: string
  householdId: number | null
  householdName: string
  fullName: string
}
