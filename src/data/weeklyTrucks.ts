import type { TruckId, WeekendRest, WeeklyTruckState } from '../types'

export const WEEKLY_STORAGE_KEY = 'dispatch-weekly-v1'
const LEGACY_INSTRUCTIONS_KEY = 'dispatch-instructions-v1'
export const WEEKLY_CHANGED_EVENT = 'dispatch-weekly-changed'

export function emptyWeeklyTruck(): WeeklyTruckState {
  return { sent: false, weekendRest: null }
}

function loadLegacyWeekendMap(): Record<string, WeekendRest> {
  const raw = localStorage.getItem(LEGACY_INSTRUCTIONS_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<
      string,
      { weekendRest?: WeekendRest }
    >
    const out: Record<string, WeekendRest> = {}
    for (const [id, state] of Object.entries(parsed)) {
      if (state?.weekendRest === 24 || state?.weekendRest === 47) {
        out[id] = state.weekendRest
      }
    }
    return out
  } catch {
    return {}
  }
}

export function normalizeWeeklyTruck(
  raw: Partial<WeeklyTruckState> | undefined,
  legacyWeekend?: WeekendRest,
): WeeklyTruckState {
  const weekend =
    raw?.weekendRest === 24 || raw?.weekendRest === 47
      ? raw.weekendRest
      : legacyWeekend === 24 || legacyWeekend === 47
        ? legacyWeekend
        : null
  return {
    sent: Boolean(raw?.sent),
    weekendRest: weekend,
  }
}

export function loadWeeklyTruckState(
  ids: TruckId[],
): Record<string, WeeklyTruckState> {
  const raw = localStorage.getItem(WEEKLY_STORAGE_KEY)
  let parsed: Record<string, Partial<WeeklyTruckState>> = {}
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, Partial<WeeklyTruckState>>
    } catch {
      parsed = {}
    }
  }
  const legacy = loadLegacyWeekendMap()
  const init: Record<string, WeeklyTruckState> = {}
  for (const id of ids) {
    init[id] = normalizeWeeklyTruck(parsed[id], legacy[id])
  }
  return init
}

export function saveWeeklyTruckState(
  state: Record<string, WeeklyTruckState>,
): void {
  localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event(WEEKLY_CHANGED_EVENT))
}

export function getWeekendRest(id: TruckId): WeekendRest {
  return loadWeeklyTruckState([id])[id]?.weekendRest ?? null
}

export function setWeekendRest(id: TruckId, value: WeekendRest): void {
  const all = loadWeeklyTruckState(
    // merge with existing keys so we don't drop other trucks
    (() => {
      try {
        const raw = localStorage.getItem(WEEKLY_STORAGE_KEY)
        if (!raw) return [id]
        const parsed = JSON.parse(raw) as Record<string, unknown>
        return [...new Set([...Object.keys(parsed), id])]
      } catch {
        return [id]
      }
    })(),
  )
  all[id] = {
    ...(all[id] ?? emptyWeeklyTruck()),
    weekendRest: value,
  }
  saveWeeklyTruckState(all)
}
