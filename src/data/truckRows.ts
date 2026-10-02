import type { TruckId } from '../types'

export const TRUCKS_ROWS_STORAGE_KEY = 'dispatch-trucks-v3'
export const TRUCKS_ROWS_CHANGED_EVENT = 'dispatch-trucks-rows-changed'

export interface SafeParkingInfo {
  safeParking: boolean
  order: string
}

export function loadSafeParkingMap(
  ids: TruckId[],
): Record<string, SafeParkingInfo> {
  const raw =
    localStorage.getItem(TRUCKS_ROWS_STORAGE_KEY) ??
    localStorage.getItem('dispatch-trucks-v2') ??
    localStorage.getItem('dispatch-trucks-v1')
  let parsed: Record<string, { safeParking?: boolean; safeParkingOrder?: string }> =
    {}
  if (raw) {
    try {
      parsed = JSON.parse(raw) as typeof parsed
    } catch {
      parsed = {}
    }
  }
  const out: Record<string, SafeParkingInfo> = {}
  for (const id of ids) {
    const row = parsed[id]
    out[id] = {
      safeParking: Boolean(row?.safeParking),
      order:
        typeof row?.safeParkingOrder === 'string'
          ? row.safeParkingOrder.trim()
          : '',
    }
  }
  return out
}

export function notifyTruckRowsChanged(): void {
  window.dispatchEvent(new Event(TRUCKS_ROWS_CHANGED_EVENT))
}
