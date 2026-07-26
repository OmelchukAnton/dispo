import { wallClockMinutesForDriving, BREAK_MINUTES, DRIVE_BLOCK_HOURS } from './breaks'

export type NightRestHours = 9 | 11 | 24 | 47

export const NIGHT_REST_OPTIONS: NightRestHours[] = [9, 11, 24, 47]

export interface EtaInput {
  start: Date
  distanceKm: number
  avgSpeedKmh: number
  driveLeftToday: number
  maxDriveHoursPerDay: number
  /** Rest after each driving day except the last (index 0 = tonight). */
  restHoursByNight: number[]
}

export interface EtaDayBreakdown {
  dayLabel: string
  dayDate: Date
  driveHours: number
  breakMinutes: number
  wallClockHours: number
  distanceKm: number
  arriveOrParkAt: Date
  note: string
}

export interface EtaResult {
  totalDriveHours: number
  totalBreakMinutes: number
  eta: Date
  days: EtaDayBreakdown[]
}

function breakMinutesForDriving(driveHours: number): number {
  if (driveHours <= 0) return 0
  const wall = wallClockMinutesForDriving(driveHours)
  return Math.max(0, wall - Math.round(driveHours * 60))
}

/** How many overnight stops are needed (days of driving − 1). */
export function estimateOvernightCount(input: {
  distanceKm: number
  avgSpeedKmh: number
  driveLeftToday: number
  maxDriveHoursPerDay: number
}): number {
  const { distanceKm, avgSpeedKmh, driveLeftToday, maxDriveHoursPerDay } = input
  if (distanceKm <= 0 || avgSpeedKmh <= 0 || maxDriveHoursPerDay <= 0) return 0

  let remainingKm = distanceKm
  let dayIndex = 0

  while (remainingKm > 0.01 && dayIndex < 30) {
    dayIndex += 1
    const dayCap =
      dayIndex === 1 ? Math.max(0, driveLeftToday) : maxDriveHoursPerDay
    if (dayCap <= 0) break
    remainingKm -= dayCap * avgSpeedKmh
  }

  return Math.max(0, dayIndex - 1)
}

/**
 * Multi-day ETA with per-night rest choice, daily driving limit,
 * and mandatory 45 min break every 4.5 h of driving.
 */
export function calculateLongTripEta(input: EtaInput): EtaResult {
  const {
    start,
    distanceKm,
    avgSpeedKmh,
    driveLeftToday,
    maxDriveHoursPerDay,
    restHoursByNight,
  } = input

  if (distanceKm <= 0 || avgSpeedKmh <= 0) {
    return { totalDriveHours: 0, totalBreakMinutes: 0, eta: start, days: [] }
  }

  const totalDriveHours = distanceKm / avgSpeedKmh
  let remainingKm = distanceKm
  let cursor = new Date(start)
  const days: EtaDayBreakdown[] = []
  let dayIndex = 0
  let totalBreakMinutes = 0

  while (remainingKm > 0.01 && dayIndex < 30) {
    dayIndex += 1
    const dayStart = new Date(cursor)
    const dayCap =
      dayIndex === 1
        ? Math.max(0, driveLeftToday)
        : maxDriveHoursPerDay

    const driveHoursToday = Math.min(dayCap, remainingKm / avgSpeedKmh)
    const drivenKm = driveHoursToday * avgSpeedKmh
    remainingKm -= drivenKm

    const breakMins = breakMinutesForDriving(driveHoursToday)
    const wallMins = wallClockMinutesForDriving(driveHoursToday)
    totalBreakMinutes += breakMins

    const arriveOrParkAt = new Date(cursor.getTime() + wallMins * 60 * 1000)
    const finished = remainingKm <= 0.01

    const breakNote =
      breakMins > 0
        ? `incl. ${breakMins} min break(s) every ${DRIVE_BLOCK_HOURS}h`
        : `no ${BREAK_MINUTES} min break needed`

    const nightRest =
      restHoursByNight[dayIndex - 1] ?? restHoursByNight.at(-1) ?? 11

    days.push({
      dayLabel: `Day ${dayIndex}`,
      dayDate: dayStart,
      driveHours: Math.round(driveHoursToday * 100) / 100,
      breakMinutes: breakMins,
      wallClockHours: Math.round((wallMins / 60) * 100) / 100,
      distanceKm: Math.round(drivenKm * 10) / 10,
      arriveOrParkAt,
      note: finished
        ? `Arrival (${breakNote})`
        : `Park for ${nightRest}h rest (${breakNote})`,
    })

    if (finished) {
      return {
        totalDriveHours: Math.round(totalDriveHours * 100) / 100,
        totalBreakMinutes,
        eta: arriveOrParkAt,
        days,
      }
    }

    cursor = new Date(arriveOrParkAt.getTime() + nightRest * 60 * 60 * 1000)
  }

  return {
    totalDriveHours: Math.round(totalDriveHours * 100) / 100,
    totalBreakMinutes,
    eta: cursor,
    days,
  }
}
