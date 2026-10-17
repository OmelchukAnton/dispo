import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  getDriverCard,
  getTruckGroup,
  normalizeTruckId,
  type TruckGroup,
} from '../data/trucks'
import type { TruckCompanyTag, TruckId, WeekendRest } from '../types'

const COMPANY_OPTIONS: { value: TruckCompanyTag | ''; label: string }[] = [
  { value: '', label: '—' },
  { value: 'prt', label: 'PRT' },
  { value: 'h1', label: 'H1' },
  { value: 'ha', label: 'HA' },
  { value: 'trl', label: 'TRL' },
]

export type BulkFillRowSeed = {
  cmr: string
  moRefusal: boolean
  safeParking: boolean
  pause: WeekendRest
}

export type BulkFillDraft = {
  key: string
  truckId: string
  group: TruckGroup
  employeeId: string
  companyTag: TruckCompanyTag | ''
  cmr: string
  pause: '' | '24' | '47'
  moRefusal: boolean
  safeParking: boolean
  /** Existing fleet plate — truck id not editable */
  locked: boolean
}

export type BulkFillOp = {
  truckId: TruckId
  isNew: boolean
  group: TruckGroup
  /** Applied as shown in the table (empty clears) */
  employeeId: string
  companyTag: TruckCompanyTag | null
  cmr: string
  pause: WeekendRest
  moRefusal: boolean
  safeParking: boolean
}

type Snapshot = {
  group: TruckGroup
  employeeId: string
  companyTag: TruckCompanyTag | ''
  cmr: string
  pause: '' | '24' | '47'
  moRefusal: boolean
  safeParking: boolean
}

interface Props {
  existingIds: TruckId[]
  seedByTruck: Record<string, BulkFillRowSeed>
  onClose: () => void
  onAccept: (ops: BulkFillOp[]) => void
}

let draftKeySeq = 0
function nextKey() {
  draftKeySeq += 1
  return `bf-${draftKeySeq}`
}

function emptyDraft(partial?: Partial<BulkFillDraft>): BulkFillDraft {
  return {
    key: nextKey(),
    truckId: '',
    group: 'fleet',
    employeeId: '',
    companyTag: '',
    cmr: '',
    pause: '',
    moRefusal: false,
    safeParking: false,
    locked: false,
    ...partial,
  }
}

function pauseToSelect(pause: WeekendRest): '' | '24' | '47' {
  if (pause === 24) return '24'
  if (pause === 47) return '47'
  return ''
}

function tagToSelect(tag: TruckCompanyTag | null | undefined): TruckCompanyTag | '' {
  if (tag === 'prt' || tag === 'h1' || tag === 'ha' || tag === 'trl') return tag
  return ''
}

function parseCompanyTag(value: TruckCompanyTag | ''): TruckCompanyTag | null {
  return value === '' ? null : value
}

function draftsFromFleet(
  ids: TruckId[],
  seedByTruck: Record<string, BulkFillRowSeed>,
): BulkFillDraft[] {
  return ids.map((id) => {
    const card = getDriverCard(id)
    const seed = seedByTruck[id]
    return emptyDraft({
      truckId: id,
      group: getTruckGroup(id),
      employeeId: card.employeeId?.trim() ?? '',
      companyTag: tagToSelect(card.companyTag),
      cmr: (seed?.cmr ?? '').trim(),
      pause: pauseToSelect(seed?.pause ?? null),
      moRefusal: Boolean(seed?.moRefusal),
      safeParking: Boolean(seed?.safeParking),
      locked: true,
    })
  })
}

function parsePause(value: '' | '24' | '47'): WeekendRest {
  if (value === '24') return 24
  if (value === '47') return 47
  return null
}

function snapshotOf(row: {
  group: TruckGroup
  employeeId: string
  companyTag: TruckCompanyTag | ''
  cmr: string
  pause: '' | '24' | '47'
  moRefusal: boolean
  safeParking: boolean
}): Snapshot {
  return {
    group: row.group,
    employeeId: row.employeeId.trim(),
    companyTag: row.companyTag,
    cmr: row.cmr.trim(),
    pause: row.pause,
    moRefusal: row.moRefusal,
    safeParking: row.safeParking,
  }
}

function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
  return (
    a.group === b.group &&
    a.employeeId === b.employeeId &&
    a.companyTag === b.companyTag &&
    a.cmr === b.cmr &&
    a.pause === b.pause &&
    a.moRefusal === b.moRefusal &&
    a.safeParking === b.safeParking
  )
}

export function BulkFillPopup({
  existingIds,
  seedByTruck,
  onClose,
  onAccept,
}: Props) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [rows, setRows] = useState<BulkFillDraft[]>(() => [
    ...draftsFromFleet(existingIds, seedByTruck),
    emptyDraft(),
    emptyDraft(),
    emptyDraft(),
  ])

  useEffect(() => {
    closeRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const existingSet = useMemo(() => new Set(existingIds), [existingIds])

  const initialByTruck = useMemo(() => {
    const map = new Map<string, Snapshot>()
    for (const id of existingIds) {
      const card = getDriverCard(id)
      const seed = seedByTruck[id]
      map.set(
        id,
        snapshotOf({
          group: getTruckGroup(id),
          employeeId: card.employeeId?.trim() ?? '',
          companyTag: tagToSelect(card.companyTag),
          cmr: (seed?.cmr ?? '').trim(),
          pause: pauseToSelect(seed?.pause ?? null),
          moRefusal: Boolean(seed?.moRefusal),
          safeParking: Boolean(seed?.safeParking),
        }),
      )
    }
    return map
  }, [existingIds, seedByTruck])

  function patchRow(key: string, partial: Partial<BulkFillDraft>) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...partial } : row)),
    )
  }

  function addRows(count = 3) {
    setRows((prev) => [
      ...prev,
      ...Array.from({ length: count }, () => emptyDraft()),
    ])
  }

  function removeRow(key: string) {
    setRows((prev) => {
      const next = prev.filter((r) => r.key !== key)
      return next.length ? next : [emptyDraft()]
    })
  }

  function handleAccept() {
    const ops: BulkFillOp[] = []
    const seen = new Set<string>()

    for (const row of rows) {
      const truckId = normalizeTruckId(row.truckId)
      if (!truckId) continue
      if (seen.has(truckId)) {
        window.alert(`Duplicate truck in the table: ${truckId}`)
        return
      }
      seen.add(truckId)

      const isNew = !existingSet.has(truckId)
      const snap = snapshotOf(row)

      if (!isNew) {
        const initial = initialByTruck.get(truckId)
        if (initial && sameSnapshot(initial, snap)) {
          continue
        }
      }

      ops.push({
        truckId,
        isNew,
        group: row.group,
        employeeId: snap.employeeId,
        companyTag: parseCompanyTag(snap.companyTag),
        cmr: snap.cmr,
        pause: parsePause(row.pause),
        moRefusal: snap.moRefusal,
        safeParking: snap.safeParking,
      })
    }

    if (!ops.length) {
      window.alert('No changes to apply — edit a row or add a new truck')
      return
    }

    const added = ops.filter((o) => o.isNew).length
    const updated = ops.filter((o) => !o.isNew).length
    if (
      !window.confirm(
        `Accept ${ops.length} row(s)?\n• Add: ${added}\n• Update: ${updated}`,
      )
    ) {
      return
    }
    onAccept(ops)
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal modal--truck modal--bulk-fill"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id={titleId}>Bulk fill</h2>
          <button
            ref={closeRef}
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <p className="bulk-fill__hint">
          Fill Driver ID, company, CMR, pause, MO Refusal and Safe parking — or
          add new plates. Accept applies only changed rows.
        </p>

        <div className="bulk-fill__table-wrap">
          <table className="bulk-fill-table">
            <thead>
              <tr>
                <th>Truck</th>
                <th>Group</th>
                <th>Driver ID</th>
                <th>Company</th>
                <th>CMR</th>
                <th>Pause</th>
                <th className="th-center">MO</th>
                <th className="th-center">Safe</th>
                <th className="bulk-fill-table__actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td>
                    <input
                      className="input input--plain"
                      value={row.truckId}
                      disabled={row.locked}
                      placeholder="AIF999"
                      onChange={(e) =>
                        patchRow(row.key, {
                          truckId: e.target.value.toUpperCase(),
                        })
                      }
                      aria-label="Truck ID"
                    />
                  </td>
                  <td>
                    <select
                      className="select select--compact"
                      value={row.group}
                      onChange={(e) =>
                        patchRow(row.key, {
                          group: e.target.value as TruckGroup,
                        })
                      }
                      aria-label={`Group for ${row.truckId || 'row'}`}
                    >
                      <option value="fleet">Fleet</option>
                      <option value="loctracker">Loc</option>
                    </select>
                  </td>
                  <td>
                    <input
                      className="input input--plain"
                      value={row.employeeId}
                      placeholder="—"
                      onChange={(e) =>
                        patchRow(row.key, { employeeId: e.target.value })
                      }
                      aria-label="Driver ID"
                    />
                  </td>
                  <td>
                    <select
                      className="select select--compact"
                      value={row.companyTag}
                      onChange={(e) =>
                        patchRow(row.key, {
                          companyTag: e.target.value as TruckCompanyTag | '',
                        })
                      }
                      aria-label={`Company for ${row.truckId || 'row'}`}
                    >
                      {COMPANY_OPTIONS.map((opt) => (
                        <option key={opt.value || 'none'} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="input input--plain input--cmr-bulk"
                      value={row.cmr}
                      placeholder="20.09"
                      maxLength={8}
                      onChange={(e) =>
                        patchRow(row.key, { cmr: e.target.value })
                      }
                      aria-label="CMR date"
                    />
                  </td>
                  <td>
                    <select
                      className={`select select--compact${
                        row.pause === '47' ? ' select--pause--47' : ''
                      }`}
                      value={row.pause}
                      onChange={(e) =>
                        patchRow(row.key, {
                          pause: e.target.value as '' | '24' | '47',
                        })
                      }
                      aria-label="Weekend pause"
                    >
                      <option value="">—</option>
                      <option value="24">24h</option>
                      <option value="47">47h</option>
                    </select>
                  </td>
                  <td className="center">
                    <input
                      type="checkbox"
                      checked={row.moRefusal}
                      onChange={(e) =>
                        patchRow(row.key, { moRefusal: e.target.checked })
                      }
                      aria-label={`MO Refusal for ${row.truckId || 'row'}`}
                    />
                  </td>
                  <td className="center">
                    <input
                      type="checkbox"
                      checked={row.safeParking}
                      onChange={(e) =>
                        patchRow(row.key, { safeParking: e.target.checked })
                      }
                      aria-label={`Safe parking for ${row.truckId || 'row'}`}
                    />
                  </td>
                  <td className="bulk-fill-table__actions">
                    <button
                      type="button"
                      className="btn btn--tiny btn--ghost"
                      onClick={() => removeRow(row.key)}
                      aria-label="Remove row"
                      title="Remove row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="modal__footer">
          <button type="button" className="btn" onClick={() => addRows(3)}>
            Add rows
          </button>
          <div className="modal__footer-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleAccept}
            >
              Accept
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
