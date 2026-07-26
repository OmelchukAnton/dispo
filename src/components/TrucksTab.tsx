import { Fragment, useMemo, useState } from 'react'
import { DRIVER_CARDS, TRUCK_IDS } from '../data/trucks'
import type { TruckId, TruckRowState } from '../types'
import { DriverPopup } from './DriverPopup'

const FIX_HOURS = Array.from({ length: 16 }, (_, i) => i + 5) // 5..20
const ETA_HOURS = Array.from({ length: 24 }, (_, i) => i) // 0..23
const STORAGE_KEY = 'dispatch-trucks-v2'

function emptyRow(): TruckRowState {
  return {
    loaded: false,
    updateClient: false,
    unloaded: false,
    informClient: false,
    closeTrip: false,
    safeParking: false,
    fixHour: '',
    newOrder: false,
    newOrderLoaded: false,
    newOrderEta: '',
    updatedAt: null,
  }
}

function normalizeRow(raw: Partial<TruckRowState> | undefined): TruckRowState {
  return {
    ...emptyRow(),
    ...raw,
    safeParking: Boolean(raw?.safeParking),
    newOrder: Boolean(raw?.newOrder),
    newOrderLoaded: Boolean(raw?.newOrderLoaded),
    newOrderEta: typeof raw?.newOrderEta === 'string' ? raw.newOrderEta : '',
  }
}

function etaDateOf(value: string): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function etaHourOf(value: string): number {
  if (!value || value.length < 13) return 0
  const hour = Number(value.slice(11, 13))
  return Number.isFinite(hour) ? hour : 0
}

function combineEta(date: string, hour: number | null): string {
  if (!date || hour === null) return date ? `${date}T00:00` : ''
  return `${date}T${String(hour).padStart(2, '0')}:00`
}

function loadInitial(): Record<TruckId, TruckRowState> {
  const raw =
    localStorage.getItem(STORAGE_KEY) ??
    localStorage.getItem('dispatch-trucks-v1')
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, Partial<TruckRowState>>
      const next = {} as Record<TruckId, TruckRowState>
      for (const id of TRUCK_IDS) next[id] = normalizeRow(parsed[id])
      return next
    } catch {
      /* fallthrough */
    }
  }
  const init = {} as Record<TruckId, TruckRowState>
  for (const id of TRUCK_IDS) init[id] = emptyRow()
  return init
}

export function TrucksTab() {
  const [rows, setRows] = useState(loadInitial)
  const [openTruck, setOpenTruck] = useState<TruckId | null>(null)

  const lastActiveId = useMemo(() => {
    let best: TruckId | null = null
    let bestTs = -1
    for (const id of TRUCK_IDS) {
      const ts = rows[id]?.updatedAt ?? -1
      if (ts > bestTs) {
        bestTs = ts
        best = id
      }
    }
    return bestTs > 0 ? best : null
  }, [rows])

  function persist(next: Record<TruckId, TruckRowState>) {
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
    persist(next)
  }

  function clearAll() {
    if (
      !window.confirm(
        'Clear all checkboxes, FIX times and New Order data for every truck?',
      )
    ) {
      return
    }
    const next = {} as Record<TruckId, TruckRowState>
    for (const id of TRUCK_IDS) next[id] = emptyRow()
    persist(next)
  }

  return (
    <section className="panel">
      <div className="panel__toolbar">
        <div>
          <h2 className="panel__title">Trucks</h2>
          <p className="panel__hint">
            Check New Order to open Loaded and ETA fields for that truck.
          </p>
        </div>
        <button type="button" className="btn btn--danger" onClick={clearAll}>
          Clear All
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table data-table--trucks">
          <thead>
            <tr>
              <th>Trucks</th>
              <th>Loaded</th>
              <th>Update client</th>
              <th>Unloaded</th>
              <th>Inform Client</th>
              <th>Close trip</th>
              <th>Safe parking</th>
              <th>New Order</th>
              <th>FIX</th>
            </tr>
          </thead>
          <tbody>
            {TRUCK_IDS.map((id) => {
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
                          title="Driver card"
                          aria-label={`Open driver card for ${id}`}
                          onClick={() => setOpenTruck(id)}
                        >
                          i
                        </button>
                        <span className="truck-id">{id}</span>
                      </div>
                    </td>
                    <td className="center">
                      <input
                        type="checkbox"
                        checked={row.loaded}
                        onChange={(e) =>
                          patch(id, { loaded: e.target.checked })
                        }
                      />
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
                        checked={row.unloaded}
                        onChange={(e) =>
                          patch(id, { unloaded: e.target.checked })
                        }
                      />
                    </td>
                    <td className="center">
                      <input
                        type="checkbox"
                        checked={row.informClient}
                        onChange={(e) =>
                          patch(id, { informClient: e.target.checked })
                        }
                      />
                    </td>
                    <td className="center">
                      <input
                        type="checkbox"
                        checked={row.closeTrip}
                        onChange={(e) =>
                          patch(id, { closeTrip: e.target.checked })
                        }
                      />
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
                        checked={row.newOrder}
                        onChange={(e) =>
                          patch(id, { newOrder: e.target.checked })
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="select select--compact"
                        value={row.fixHour === '' ? '' : String(row.fixHour)}
                        onChange={(e) => {
                          const v = e.target.value
                          patch(id, {
                            fixHour: v === '' ? '' : Number(v),
                          })
                        }}
                      >
                        <option value="">—</option>
                        {FIX_HOURS.map((h) => (
                          <option key={h} value={h}>
                            {h}:00
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {row.newOrder && (
                    <tr className={`sub-row ${active ? 'row-active' : ''}`}>
                      <td colSpan={9}>
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
            })}
          </tbody>
        </table>
      </div>

      {openTruck && (
        <DriverPopup
          truckId={openTruck}
          card={DRIVER_CARDS[openTruck]}
          onClose={() => setOpenTruck(null)}
        />
      )}
    </section>
  )
}
