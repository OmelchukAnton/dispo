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
import { DriverPopup } from './DriverPopup'

const ETA_HOURS = Array.from({ length: 24 }, (_, i) => i) // 0..23
const STORAGE_KEY = 'dispatch-trucks-v3'

function emptyRow(): TruckRowState {
  return {
    loaded: false,
    updateClient: false,
    unloaded: false,
    informClient: false,
    closeTrip: false,
    safeParking: false,
    moRefusal: false,
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
    updateClient: Boolean(raw?.updateClient),
    closeTrip: Boolean(raw?.closeTrip),
    safeParking: Boolean(raw?.safeParking),
    moRefusal: Boolean(raw?.moRefusal),
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

  function clearAll() {
    if (
      !window.confirm(
        'Clear Morning Update, All trips are closed, Safe parking, MO Refusal and New Order for every truck?',
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
          </tr>
          {row.newOrder && (
            <tr className={`sub-row ${active ? 'row-active' : ''}`}>
              <td colSpan={6}>
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
            Open truck info to edit driver / trailer or delete. Add truck via
            the button.
          </p>
        </div>
        <div className="panel__toolbar-actions">
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
                <span>All trips</span>
                <span>are closed</span>
              </th>
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
            </tr>
          </thead>
          <tbody>
            {mainIds.length > 0 && (
              <tr className="fleet-group-row">
                <td colSpan={6}>Fleet</td>
              </tr>
            )}
            {renderTruckRows(mainIds)}
            {loctrackerIds.length > 0 && (
              <tr className="fleet-group-row fleet-group-row--loctracker">
                <td colSpan={6}>Loctracker</td>
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
