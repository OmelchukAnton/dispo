import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  addTruckToGroup,
  FLEET_CHANGED_EVENT,
  getDriverCard,
  getTruckGroup,
  loadFleetIds,
  removeTruckEverywhere,
  saveDriverCard,
  setTruckGroup,
  splitFleetGroups,
  type TruckGroup,
} from '../data/trucks'
import type { DriverCard, TruckId, TruckRowState } from '../types'
import {
  estimateParkingArrive,
  formatArriveClock,
} from '../utils/parkingEta'
import { DriverPopup } from './DriverPopup'

const ETA_HOURS = Array.from({ length: 24 }, (_, i) => i) // 0..23
const STORAGE_KEY = 'dispatch-trucks-v3'
const COL_COUNT = 12

function parseOptionalNumber(value: unknown): number | '' {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.replace(',', '.'))
    return Number.isFinite(n) ? n : ''
  }
  return ''
}

function emptyRow(): TruckRowState {
  return {
    loaded: false,
    updateClient: false,
    unloadBy11: false,
    unloaded: false,
    informClient: false,
    todayUnloading: false,
    todayUnloadingEta: '',
    safeParking: false,
    moRefusal: false,
    fixHour: '',
    newOrder: false,
    newOrderLoaded: false,
    newOrderEta: '',
    kmLeft: '',
    driveLeftHours: '',
    arriveEta: '',
    updatedAt: null,
  }
}

function normalizeRow(
  raw: (Partial<TruckRowState> & { closeTrip?: boolean }) | undefined,
): TruckRowState {
  const { closeTrip: legacyCloseTrip, ...rest } = raw ?? {}
  const kmLeft = parseOptionalNumber(rest.kmLeft)
  const driveLeftHours = parseOptionalNumber(rest.driveLeftHours)
  return {
    ...emptyRow(),
    ...rest,
    updateClient: Boolean(rest.updateClient),
    unloadBy11: Boolean(rest.unloadBy11),
    todayUnloading: Boolean(rest.todayUnloading ?? legacyCloseTrip),
    todayUnloadingEta:
      typeof rest.todayUnloadingEta === 'string' ? rest.todayUnloadingEta : '',
    safeParking: Boolean(rest.safeParking),
    moRefusal: Boolean(rest.moRefusal),
    newOrder: Boolean(rest.newOrder),
    newOrderLoaded: Boolean(rest.newOrderLoaded),
    newOrderEta: typeof rest.newOrderEta === 'string' ? rest.newOrderEta : '',
    kmLeft: kmLeft === '' || (kmLeft as number) < 0 ? '' : kmLeft,
    driveLeftHours:
      driveLeftHours === '' || (driveLeftHours as number) < 0
        ? ''
        : driveLeftHours,
    arriveEta: typeof rest.arriveEta === 'string' ? rest.arriveEta : '',
  }
}

function etaDateOf(value: string): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function etaHourOf(value: string): number {
  if (!value) return 0
  // "14:00" or "2026-08-16T14:00"
  const fromTime = value.match(/^(\d{1,2}):/)
  if (fromTime) {
    const hour = Number(fromTime[1])
    return Number.isFinite(hour) ? hour : 0
  }
  if (value.length >= 13) {
    const hour = Number(value.slice(11, 13))
    return Number.isFinite(hour) ? hour : 0
  }
  const asNum = Number(value)
  return Number.isFinite(asNum) ? asNum : 0
}

function combineEta(date: string, hour: number | null): string {
  if (!date || hour === null) return date ? `${date}T00:00` : ''
  return `${date}T${String(hour).padStart(2, '0')}:00`
}

function loadRows(ids: TruckId[]): Record<string, TruckRowState> {
  const raw =
    localStorage.getItem(STORAGE_KEY) ??
    localStorage.getItem('dispatch-trucks-v2') ??
    localStorage.getItem('dispatch-trucks-v1')
  let parsed: Record<string, Partial<TruckRowState>> = {}
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, Partial<TruckRowState>>
    } catch {
      parsed = {}
    }
  }
  const next: Record<string, TruckRowState> = {}
  for (const id of ids) next[id] = normalizeRow(parsed[id])
  return next
}

type PopupState =
  | { kind: 'add' }
  | { kind: 'edit'; truckId: TruckId }
  | null

export function TrucksTab() {
  const [truckIds, setTruckIds] = useState<TruckId[]>(() => loadFleetIds())
  const [rows, setRows] = useState(() => loadRows(loadFleetIds()))
  const [popup, setPopup] = useState<PopupState>(null)
  const [cardTick, setCardTick] = useState(0)
  const [groupTick, setGroupTick] = useState(0)

  useEffect(() => {
    function syncFleet() {
      const ids = loadFleetIds()
      setTruckIds(ids)
      setGroupTick((n) => n + 1)
      setRows((prev) => {
        const next: Record<string, TruckRowState> = {}
        for (const id of ids) next[id] = normalizeRow(prev[id])
        return next
      })
    }
    window.addEventListener(FLEET_CHANGED_EVENT, syncFleet)
    return () => window.removeEventListener(FLEET_CHANGED_EVENT, syncFleet)
  }, [])

  const lastActiveId = useMemo(() => {
    let best: TruckId | null = null
    let bestTs = -1
    for (const id of truckIds) {
      const ts = rows[id]?.updatedAt ?? -1
      if (ts > bestTs) {
        bestTs = ts
        best = id
      }
    }
    return bestTs > 0 ? best : null
  }, [rows, truckIds])

  function persistRows(next: Record<string, TruckRowState>) {
    setRows(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function patch(id: TruckId, partial: Partial<TruckRowState>) {
    const next = {
      ...rows,
      [id]: {
        ...normalizeRow(rows[id]),
        ...partial,
        updatedAt: Date.now(),
      },
    }
    persistRows(next)
  }

  function calcArriveEta(id: TruckId) {
    const row = normalizeRow(rows[id])
    if (row.kmLeft === '' || row.kmLeft <= 0) {
      patch(id, { arriveEta: '' })
      return
    }
    if (row.driveLeftHours === '' || row.driveLeftHours < 0) {
      window.alert('Enter Drive left (h), then Calc')
      return
    }
    const now = new Date()
    const arrive = estimateParkingArrive({
      now,
      distanceKm: row.kmLeft,
      driveLeftHours: row.driveLeftHours,
    })
    if (!arrive) {
      patch(id, { arriveEta: '' })
      return
    }
    patch(id, { arriveEta: formatArriveClock(arrive, now) })
  }

  function clearAll() {
    if (
      !window.confirm(
        'Clear Morning Update, Unload before 11, Today unloading, ETA, Safe parking, MO Refusal and New Order for every truck?',
      )
    ) {
      return
    }
    const next: Record<string, TruckRowState> = {}
    for (const id of truckIds) next[id] = emptyRow()
    persistRows(next)
  }

  function handleAddSave(id: TruckId, group: TruckGroup, card: DriverCard) {
    const ids = addTruckToGroup(id, group)
    saveDriverCard(id, card)
    setTruckIds(ids)
    setGroupTick((n) => n + 1)
    setCardTick((n) => n + 1)
    persistRows({ ...rows, [id]: emptyRow() })
    setPopup(null)
  }

  function handleEditSave(
    truckId: TruckId,
    card: DriverCard,
    group: TruckGroup,
  ) {
    saveDriverCard(truckId, card)
    setTruckGroup(truckId, group)
    setTruckIds(loadFleetIds())
    setGroupTick((n) => n + 1)
    setCardTick((n) => n + 1)
    setPopup(null)
  }

  function handleDelete(truckId: TruckId) {
    const ids = removeTruckEverywhere(truckId)
    setTruckIds(ids)
    setGroupTick((n) => n + 1)
    const next = { ...rows }
    delete next[truckId]
    persistRows(next)
    setPopup(null)
  }

  const { main: mainIds, loctracker: loctrackerIds } = useMemo(
    () => splitFleetGroups(truckIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [truckIds, groupTick],
  )

  const unloadBy11Count = useMemo(
    () => truckIds.filter((id) => normalizeRow(rows[id]).unloadBy11).length,
    [rows, truckIds],
  )

  function renderTruckRows(ids: TruckId[]) {
    return ids.map((id) => {
      const row = normalizeRow(rows[id])
      const active = id === lastActiveId
      return (
        <Fragment key={id}>
          <tr className={active ? 'row-active' : undefined}>
            <td>
              <div className="truck-cell">
                <button
                  type="button"
                  className="info-btn"
                  title="Truck info"
                  aria-label={`Open truck info for ${id}`}
                  onClick={() => setPopup({ kind: 'edit', truckId: id })}
                >
                  i
                </button>
                <span className="truck-id">
                  {id}
                  {(() => {
                    const trailer = getDriverCard(id).trailer?.trim()
                    return trailer ? ` / ${trailer}` : ''
                  })()}
                </span>
              </div>
            </td>
            <td className="center">
              <input
                type="checkbox"
                checked={row.updateClient}
                onChange={(e) =>
                  patch(id, { updateClient: e.target.checked })
                }
              />
            </td>
            <td className="center">
              <input
                type="checkbox"
                checked={row.unloadBy11}
                onChange={(e) =>
                  patch(id, { unloadBy11: e.target.checked })
                }
              />
            </td>
            <td className="center">
              <input
                type="checkbox"
                checked={row.todayUnloading}
                onChange={(e) =>
                  patch(id, { todayUnloading: e.target.checked })
                }
              />
            </td>
            <td className="eta-cell">
              <select
                className="select select--compact"
                value={
                  row.todayUnloadingEta
                    ? String(etaHourOf(row.todayUnloadingEta))
                    : ''
                }
                onChange={(e) => {
                  const hour =
                    e.target.value === '' ? null : Number(e.target.value)
                  patch(id, {
                    todayUnloadingEta:
                      hour === null
                        ? ''
                        : `${String(hour).padStart(2, '0')}:00`,
                  })
                }}
                aria-label={`ETA time for ${id}`}
              >
                <option value="">—</option>
                {ETA_HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </td>
            <td className="center">
              <input
                type="checkbox"
                checked={row.safeParking}
                onChange={(e) =>
                  patch(id, { safeParking: e.target.checked })
                }
              />
            </td>
            <td className="center">
              <input
                type="checkbox"
                checked={row.moRefusal}
                onChange={(e) =>
                  patch(id, { moRefusal: e.target.checked })
                }
              />
            </td>
            <td className="center">
              <input
                type="checkbox"
                checked={row.newOrder}
                onChange={(e) =>
                  patch(id, { newOrder: e.target.checked })
                }
              />
            </td>
            <td className="km-cell">
              <input
                type="number"
                min={0}
                step={1}
                className="input input--km"
                value={row.kmLeft === '' ? '' : row.kmLeft}
                placeholder="—"
                onChange={(e) => {
                  const v = e.target.value.trim()
                  if (v === '') {
                    patch(id, { kmLeft: '', arriveEta: '' })
                    return
                  }
                  const n = Number(v.replace(',', '.'))
                  patch(id, {
                    kmLeft: Number.isFinite(n) && n >= 0 ? n : '',
                    arriveEta: '',
                  })
                }}
                aria-label={`KM left for ${id}`}
              />
            </td>
            <td className="km-cell">
              <input
                type="number"
                min={0}
                step={0.5}
                className="input input--km"
                value={row.driveLeftHours === '' ? '' : row.driveLeftHours}
                placeholder="—"
                onChange={(e) => {
                  const v = e.target.value.trim()
                  if (v === '') {
                    patch(id, { driveLeftHours: '', arriveEta: '' })
                    return
                  }
                  const n = Number(v.replace(',', '.'))
                  patch(id, {
                    driveLeftHours: Number.isFinite(n) && n >= 0 ? n : '',
                    arriveEta: '',
                  })
                }}
                aria-label={`Drive left hours for ${id}`}
              />
            </td>
            <td className="center">
              <button
                type="button"
                className="btn btn--primary btn--tiny"
                disabled={
                  row.kmLeft === '' ||
                  row.kmLeft <= 0 ||
                  row.driveLeftHours === ''
                }
                onClick={() => calcArriveEta(id)}
              >
                Calc
              </button>
            </td>
            <td className="arrive-cell">
              {row.arriveEta ? (
                <strong className="arrive-eta">{row.arriveEta}</strong>
              ) : (
                <span className="muted">—</span>
              )}
            </td>
          </tr>
          {row.newOrder && (
            <tr className={`sub-row ${active ? 'row-active' : ''}`}>
              <td colSpan={COL_COUNT}>
                <div className="new-order">
                  <span className="new-order__label">New Order</span>
                  <label className="new-order__check">
                    <input
                      type="checkbox"
                      checked={row.newOrderLoaded}
                      onChange={(e) =>
                        patch(id, {
                          newOrderLoaded: e.target.checked,
                        })
                      }
                    />
                    Loaded
                  </label>
                  <label className="new-order__eta">
                    <span>ETA date</span>
                    <input
                      type="date"
                      className="input input--datetime"
                      value={etaDateOf(row.newOrderEta)}
                      onChange={(e) =>
                        patch(id, {
                          newOrderEta: combineEta(
                            e.target.value,
                            etaHourOf(row.newOrderEta),
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="new-order__eta">
                    <span>ETA time</span>
                    <select
                      className="select select--compact"
                      value={
                        row.newOrderEta
                          ? String(etaHourOf(row.newOrderEta))
                          : ''
                      }
                      onChange={(e) => {
                        const hour =
                          e.target.value === ''
                            ? null
                            : Number(e.target.value)
                        patch(id, {
                          newOrderEta: combineEta(
                            etaDateOf(row.newOrderEta),
                            hour,
                          ),
                        })
                      }}
                    >
                      <option value="">—</option>
                      {ETA_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </td>
            </tr>
          )}
        </Fragment>
      )
    })
  }

  // cardTick keeps edit popup data fresh after saves
  void cardTick

  return (
    <section className="panel">
      <div className="panel__toolbar">
        <div>
          <h2 className="panel__title">Trucks</h2>
          <p className="panel__hint">
            Per truck: KM left + Drive left → Calc Arrive ETA (67 km/h, 45 min /
            4.5h).
          </p>
        </div>
        <div className="panel__toolbar-actions">
          <div
            className={`unload-stat ${unloadBy11Count > 0 ? 'unload-stat--active' : ''}`}
            title="Trucks unloaded before 11:00"
          >
            <span className="unload-stat__label">Unloaded before 11</span>
            <strong className="unload-stat__value">{unloadBy11Count}</strong>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setPopup({ kind: 'add' })}
          >
            Add truck
          </button>
          <button type="button" className="btn btn--danger" onClick={clearAll}>
            Clear All
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table data-table--trucks">
          <thead>
            <tr>
              <th>Trucks</th>
              <th className="th-stack">
                <span>Morning</span>
                <span>Update</span>
              </th>
              <th className="th-stack">
                <span>Unload</span>
                <span>before 11</span>
              </th>
              <th className="th-stack">
                <span>Today</span>
                <span>unloading</span>
              </th>
              <th>ETA</th>
              <th className="th-stack">
                <span>Safe</span>
                <span>parking</span>
              </th>
              <th className="th-stack">
                <span>MO</span>
                <span>Refusal</span>
              </th>
              <th className="th-stack">
                <span>New</span>
                <span>Order</span>
              </th>
              <th className="th-stack">
                <span>KM</span>
                <span>left</span>
              </th>
              <th className="th-stack">
                <span>Drive</span>
                <span>left (h)</span>
              </th>
              <th></th>
              <th className="th-stack">
                <span>Arrive</span>
                <span>ETA</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {mainIds.length > 0 && (
              <tr className="fleet-group-row">
                <td colSpan={COL_COUNT}>Fleet</td>
              </tr>
            )}
            {renderTruckRows(mainIds)}
            {loctrackerIds.length > 0 && (
              <tr className="fleet-group-row fleet-group-row--loctracker">
                <td colSpan={COL_COUNT}>Loctracker</td>
              </tr>
            )}
            {renderTruckRows(loctrackerIds)}
          </tbody>
        </table>
      </div>

      {popup?.kind === 'add' && (
        <DriverPopup
          mode="add"
          existingIds={truckIds}
          onClose={() => setPopup(null)}
          onSave={handleAddSave}
        />
      )}
      {popup?.kind === 'edit' && (
        <DriverPopup
          key={`${popup.truckId}-${cardTick}`}
          mode="edit"
          truckId={popup.truckId}
          card={getDriverCard(popup.truckId)}
          group={getTruckGroup(popup.truckId)}
          onClose={() => setPopup(null)}
          onSave={(card, group) =>
            handleEditSave(popup.truckId, card, group)
          }
          onDelete={() => handleDelete(popup.truckId)}
        />
      )}
    </section>
  )
}
