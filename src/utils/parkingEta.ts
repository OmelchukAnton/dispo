import { addMinutes } from 'date-fns'
import { wallClockMinutesForDriving } from './breaks'

export const AVG_SPEED_KMH = 67

/** Same rounding as Generate Instructions (:00 / :30). */
export function roundToHalfHour(date: Date): Date {
  const d = new Date(date)
  const totalMins = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
  const rounded = Math.round(totalMins / 30) * 30
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  out.setMinutes(rounded)
  return out
}

export function formatArriveClock(date: Date, now = new Date()): string {
  const rounded = roundToHalfHour(date)
  const h = rounded.getHours()
  const m = rounded.getMinutes()
  const clock = `${h}:${String(m).padStart(2, '0')}`
  const sameDay =
    rounded.getFullYear() === now.getFullYear() &&
    rounded.getMonth() === now.getMonth() &&
    rounded.getDate() === now.getDate()
  if (sameDay) return clock

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow =
    rounded.getFullYear() === tomorrow.getFullYear() &&
    rounded.getMonth() === tomorrow.getMonth() &&
    rounded.getDate() === tomorrow.getDate()
  if (isTomorrow) return `tom ${clock}`

  const dd = String(rounded.getDate()).padStart(2, '0')
  const mm = String(rounded.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm} ${clock}`
}

/**
 * Arrive ETA from KM left + drive hours left (Generate Instructions rule):
 * today drive = min(driveLeft, km/67), with 45 min break every 4.5h.
 */
export function estimateParkingArrive(input: {
  now: Date
  distanceKm: number
  driveLeftHours: number
  avgSpeedKmh?: number
}): Date | null {
  const speed = input.avgSpeedKmh ?? AVG_SPEED_KMH
  const { now, distanceKm, driveLeftHours } = input
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null
  if (!Number.isFinite(speed) || speed <= 0) return null
  if (!Number.isFinite(driveLeftHours) || driveLeftHours < 0) return null

  const tripDriveHours = distanceKm / speed
  const todayDriveHours = Math.min(driveLeftHours, tripDriveHours)
  if (todayDriveHours <= 0) return new Date(now)

  return addMinutes(now, wallClockMinutesForDriving(todayDriveHours))
}
