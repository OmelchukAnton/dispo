/** Parse checklist CMR short date: 20.09, 02/08, optional year. */
export function parseCmrShortDate(
  value: string,
  now = new Date(),
): Date | null {
  const m = value
    .trim()
    .match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2]) - 1
  if (day < 1 || day > 31 || month < 0 || month > 11) return null

  let year: number
  if (m[3]) {
    year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])
  } else {
    year = now.getFullYear()
  }

  let d = new Date(year, month, day)
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month ||
    d.getDate() !== day
  ) {
    return null
  }

  // Without year: if date is still in the future, treat as previous year
  if (!m[3]) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (d > today) d = new Date(year - 1, month, day)
  }

  return d
}

/** Whole days from CMR date to today. null if unparseable. */
export function cmrDaysSince(value: string, now = new Date()): number | null {
  const d = parseCmrShortDate(value, now)
  if (!d) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((today.getTime() - start.getTime()) / 86_400_000)
}

export const CMR_WARN_DAYS = 10
export const CMR_DANGER_DAYS = 14

export type CmrAlertLevel = 'ok' | 'warn' | 'danger'

/** >14 days → danger (red border), >10 → warn (yellow). */
export function getCmrAlertLevel(
  value: string,
  now = new Date(),
): CmrAlertLevel {
  const days = cmrDaysSince(value, now)
  if (days == null) return 'ok'
  if (days > CMR_DANGER_DAYS) return 'danger'
  if (days > CMR_WARN_DAYS) return 'warn'
  return 'ok'
}
