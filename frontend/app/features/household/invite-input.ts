/** Matches backend: excludes I, L, O, 0, 1 */
export const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789" as const

const allowed = new Set(INVITE_ALPHABET.split(""))

/**
 * Uppercase, strip spaces/hyphens, keep only allowed chars.
 * Does NOT truncate — zod schema enforces length(6) so an over-long paste
 * surfaces an inline error instead of being silently shortened.
 */
export function normalizeInviteInput(raw: string): string {
  let out = ""
  for (const ch of raw.toUpperCase()) {
    if (ch === " " || ch === "-") continue
    if (!allowed.has(ch)) continue
    out += ch
  }
  return out
}

export function inviteCodeHasInvalidChars(raw: string): boolean {
  for (const ch of raw.toUpperCase()) {
    if (ch === " " || ch === "-") continue
    if (!allowed.has(ch)) return true
  }
  return false
}

export function formatInviteForDisplay(code: string): string {
  if (code.length <= 3) return code
  return `${code.slice(0, 3)} ${code.slice(3)}`
}
