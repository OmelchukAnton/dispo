import type { DriverCard, TruckId } from '../types'

export type TruckGroup = 'fleet' | 'loctracker'

/** Default Loctracker plates */
export const DEFAULT_LOCTRACKER_IDS: TruckId[] = [
  'MOF688',
  'MSF879',
  'NHM791',
  'NJO636',
  'NJO638',
]

/** @deprecated use loadLoctrackerIds() */
export const LOCTRACKER_TRUCK_IDS = DEFAULT_LOCTRACKER_IDS

export const FLEET_STORAGE_KEY = 'dispatch-fleet-v1'
export const LOCTRACKER_STORAGE_KEY = 'dispatch-loctracker-v1'
export const FLEET_CHANGED_EVENT = 'dispatch-fleet-changed'

export function loadLoctrackerIds(): TruckId[] {
  const raw = localStorage.getItem(LOCTRACKER_STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return [
          ...new Set(
            parsed
              .map((v) => String(v).trim().toUpperCase())
              .filter(Boolean),
          ),
        ]
      }
    } catch {
      /* fallthrough */
    }
  }
  return [...DEFAULT_LOCTRACKER_IDS]
}

export function saveLoctrackerIds(ids: TruckId[]): void {
  const clean = [
    ...new Set(ids.map((id) => id.trim().toUpperCase()).filter(Boolean)),
  ]
  localStorage.setItem(LOCTRACKER_STORAGE_KEY, JSON.stringify(clean))
}

export function isLoctrackerTruck(id: TruckId): boolean {
  return loadLoctrackerIds().includes(id)
}

/** Main fleet first, then Loctracker — keeps groups together */
export function orderFleetIds(
  ids: TruckId[],
  loctrackerIds: TruckId[] = loadLoctrackerIds(),
): TruckId[] {
  const locSet = new Set(loctrackerIds)
  const main: TruckId[] = []
  const loc: TruckId[] = []
  for (const id of ids) {
    if (locSet.has(id)) loc.push(id)
    else main.push(id)
  }
  return [...main, ...loc]
}

export function splitFleetGroups(ids: TruckId[]): {
  main: TruckId[]
  loctracker: TruckId[]
} {
  const locSet = new Set(loadLoctrackerIds())
  const main: TruckId[] = []
  const loctracker: TruckId[] = []
  for (const id of ids) {
    if (locSet.has(id)) loctracker.push(id)
    else main.push(id)
  }
  return { main, loctracker }
}

export const DEFAULT_TRUCK_IDS: TruckId[] = orderFleetIds(
  [
    'AFI363',
    'AIF220',
    'AIF242',
    'AIN471',
    'AYA796',
    'AYA824',
    'MNB814',
    'MNB854',
    'MOF455',
    'NEV532',
    'NRP081',
    'NSN238',
    'NSN312',
    'NUI290',
    ...DEFAULT_LOCTRACKER_IDS,
  ],
  DEFAULT_LOCTRACKER_IDS,
)

/** @deprecated use loadFleetIds() for the live fleet list */
export const TRUCK_IDS = DEFAULT_TRUCK_IDS

function blankCard(truck: TruckId): DriverCard {
  return {
    driverName: '',
    birthDate: '',
    employeeId: '',
    truckCompany: truck,
    trailer: '',
    mechanic: '',
    missing: '',
    cmrDate: '',
  }
}

const KNOWN_CARDS: Record<string, DriverCard> = {
  NRP081: {
    driverName: 'Rajendra Bijarniya',
    birthDate: '1997.07.01',
    employeeId: '0000',
    truckCompany: 'NRP081',
    trailer: 'SN021',
    mechanic: 'marius + email',
    missing: 'no OMV no TMB',
    cmrDate: 'CMR 05.07',
  },
}

const DRIVER_CARDS_STORAGE_KEY = 'dispatch-driver-cards-v1'

function loadStoredCards(): Record<string, DriverCard> {
  const raw = localStorage.getItem(DRIVER_CARDS_STORAGE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, DriverCard>
    }
  } catch {
    /* ignore */
  }
  return {}
}

export function getDriverCard(truck: TruckId): DriverCard {
  const stored = loadStoredCards()[truck]
  if (stored) {
    return { ...blankCard(truck), ...stored, truckCompany: stored.truckCompany || truck }
  }
  const known = KNOWN_CARDS[truck]
  if (known) return { ...known }
  return blankCard(truck)
}

export function saveDriverCard(truck: TruckId, card: DriverCard): void {
  const all = loadStoredCards()
  all[truck] = {
    ...blankCard(truck),
    ...card,
    truckCompany: card.truckCompany.trim() || truck,
  }
  localStorage.setItem(DRIVER_CARDS_STORAGE_KEY, JSON.stringify(all))
}

export function deleteDriverCard(truck: TruckId): void {
  const all = loadStoredCards()
  delete all[truck]
  localStorage.setItem(DRIVER_CARDS_STORAGE_KEY, JSON.stringify(all))
}

/** Keep for older imports */
export const DRIVER_CARDS: Record<string, DriverCard> = Object.fromEntries(
  DEFAULT_TRUCK_IDS.map((id) => [id, getDriverCard(id)]),
)

export function loadFleetIds(): TruckId[] {
  migrateRenamedTrucks()
  ensureLoctrackerDefaults()
  const raw = localStorage.getItem(FLEET_STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        const ids = parsed
          .map((v) => String(v).trim().toUpperCase())
          .filter(Boolean)
          .map((id) => (id === 'AIF363' ? 'AFI363' : id))
          .filter((id) => id !== 'AIN475')
        const unique = orderFleetIds(ensureNewTrucks([...new Set(ids)]))
        if (unique.length) {
          if (JSON.stringify(unique) !== JSON.stringify(parsed)) {
            localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(unique))
          }
          return unique
        }
      }
    } catch {
      /* fallthrough */
    }
  }
  return [...DEFAULT_TRUCK_IDS]
}

function ensureLoctrackerDefaults() {
  if (!localStorage.getItem(LOCTRACKER_STORAGE_KEY)) {
    saveLoctrackerIds(DEFAULT_LOCTRACKER_IDS)
  }
}

function ensureNewTrucks(ids: TruckId[]): TruckId[] {
  const flag = 'dispatch-fleet-add-aug9'
  if (localStorage.getItem(flag)) return ids
  localStorage.setItem(flag, '1')
  const set = new Set(ids)
  let changed = false
  for (const id of DEFAULT_LOCTRACKER_IDS) {
    if (!set.has(id)) {
      ids.push(id)
      set.add(id)
      changed = true
    }
  }
  if (changed) {
    localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(orderFleetIds(ids)))
  }
  return ids
}

/** One-time: AIF363 → AFI363, drop AIN475, remap checklist/instruction keys. */
function migrateRenamedTrucks() {
  const flag = 'dispatch-fleet-migrate-afi363'
  if (localStorage.getItem(flag)) return
  localStorage.setItem(flag, '1')

  for (const key of [
    'dispatch-trucks-v3',
    'dispatch-trucks-v2',
    'dispatch-trucks-v1',
    'dispatch-instructions-v1',
  ]) {
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const obj = JSON.parse(raw) as Record<string, unknown>
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) continue
      let changed = false
      if ('AIF363' in obj && !('AFI363' in obj)) {
        obj.AFI363 = obj.AIF363
        delete obj.AIF363
        changed = true
      } else if ('AIF363' in obj) {
        delete obj.AIF363
        changed = true
      }
      if ('AIN475' in obj) {
        delete obj.AIN475
        changed = true
      }
      if (changed) localStorage.setItem(key, JSON.stringify(obj))
    } catch {
      /* ignore */
    }
  }
}

export function saveFleetIds(ids: TruckId[]): void {
  const clean = orderFleetIds([
    ...new Set(ids.map((id) => id.trim().toUpperCase()).filter(Boolean)),
  ])
  localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(clean))
  window.dispatchEvent(new Event(FLEET_CHANGED_EVENT))
}

/** Add truck and assign Fleet or Loctracker group. */
export function addTruckToGroup(id: TruckId, group: TruckGroup): TruckId[] {
  const truckId = normalizeTruckId(id)
  const ids = loadFleetIds()
  if (!ids.includes(truckId)) ids.push(truckId)

  const loc = loadLoctrackerIds()
  if (group === 'loctracker') {
    if (!loc.includes(truckId)) loc.push(truckId)
  } else {
    const idx = loc.indexOf(truckId)
    if (idx >= 0) loc.splice(idx, 1)
  }
  saveLoctrackerIds(loc)
  saveFleetIds(ids)
  return orderFleetIds(ids, loc)
}

export function removeTruckEverywhere(id: TruckId): TruckId[] {
  const truckId = normalizeTruckId(id)
  const ids = loadFleetIds().filter((t) => t !== truckId)
  saveLoctrackerIds(loadLoctrackerIds().filter((t) => t !== truckId))
  deleteDriverCard(truckId)
  saveFleetIds(ids)
  return ids
}

export function getTruckGroup(id: TruckId): TruckGroup {
  return isLoctrackerTruck(id) ? 'loctracker' : 'fleet'
}

export function setTruckGroup(id: TruckId, group: TruckGroup): void {
  const truckId = normalizeTruckId(id)
  const loc = loadLoctrackerIds().filter((t) => t !== truckId)
  if (group === 'loctracker') loc.push(truckId)
  saveLoctrackerIds(loc)
  saveFleetIds(loadFleetIds())
}

export function normalizeTruckId(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '')
}
