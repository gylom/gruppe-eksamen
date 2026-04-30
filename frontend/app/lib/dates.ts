/** Local calendar pieces — avoid UTC drift from `toISOString()`. */
export function formatDateKeyFromParts(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, "0")
  const dd = String(d).padStart(2, "0")
  return `${y}-${mm}-${dd}`
}

export function parseDateKeyLocal(key: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim())
  if (!match) throw new Error(`Invalid date key: ${key}`)
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) }
}

/** Midnight local time for that calendar day */
export function localDateFromKey(key: string): Date {
  const { y, m, d } = parseDateKeyLocal(key)
  return new Date(y, m - 1, d)
}

/** Monday date key for the week containing `ref` (local calendar). */
export function getMondayKeyContaining(ref: Date = new Date()): string {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  const dow = d.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + offset)
  return formatDateKeyFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function addDaysToKey(key: string, deltaDays: number): string {
  const d = localDateFromKey(key)
  d.setDate(d.getDate() + deltaDays)
  return formatDateKeyFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function addWeeksToMondayKey(mondayKey: string, weeks: number): string {
  return addDaysToKey(mondayKey, weeks * 7)
}

export function isMondayKey(key: string): boolean {
  try {
    return localDateFromKey(key).getDay() === 1
  } catch {
    return false
  }
}

export type WeekDayInfo = { dateKey: string; dayNumber: number }

/** Seven entries Mon–Sun; `dayNumber` is 1..7 (Mon..Sun). */
export function expandWeekFromMonday(mondayKey: string): WeekDayInfo[] {
  const out: WeekDayInfo[] = []
  for (let i = 0; i < 7; i++) {
    out.push({
      dateKey: addDaysToKey(mondayKey, i),
      dayNumber: i + 1,
    })
  }
  return out
}

export function defaultDayNumberForWeek(mondayKey: string, ref: Date = new Date()): number {
  const week = expandWeekFromMonday(mondayKey)
  const todayKey = formatDateKeyFromParts(ref.getFullYear(), ref.getMonth() + 1, ref.getDate())
  const hit = week.find((w) => w.dateKey === todayKey)
  if (hit) return hit.dayNumber
  const tMs = localDateFromKey(todayKey).getTime()
  const monMs = localDateFromKey(week[0].dateKey).getTime()
  const sunMs = localDateFromKey(week[6].dateKey).getTime()
  if (tMs < monMs) return 1
  if (tMs > sunMs) return 7
  return 1
}

export function formatWeekRangeTitleNb(mondayKey: string): string {
  const start = localDateFromKey(mondayKey)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
  const fmt = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "short" })
  return `${fmt.format(start)}–${fmt.format(end)}`
}

export function weekdayShortNb(dayNumber: number): string {
  const labels = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"]
  return labels[dayNumber - 1] ?? ""
}
