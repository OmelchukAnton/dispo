/** EU-style: 45 min break after every 4.5 h of driving. */
export const DRIVE_BLOCK_HOURS = 4.5
export const BREAK_MINUTES = 45

/**
 * Wall-clock minutes needed to complete `driveHours` of driving,
 * inserting a 45-minute break after every full 4.5h driving block
 * (except after the last block if the trip ends there).
 */
export function wallClockMinutesForDriving(driveHours: number): number {
  if (!Number.isFinite(driveHours) || driveHours <= 0) return 0

  const driveMinutes = driveHours * 60
  const blockMinutes = DRIVE_BLOCK_HOURS * 60
  let remaining = driveMinutes
  let elapsed = 0

  while (remaining > 0) {
    const segment = Math.min(blockMinutes, remaining)
    elapsed += segment
    remaining -= segment
    if (remaining > 0) {
      elapsed += BREAK_MINUTES
    }
  }

  return Math.round(elapsed)
}
