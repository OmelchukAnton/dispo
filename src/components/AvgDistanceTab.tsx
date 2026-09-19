import { useEffect, useMemo, useState } from 'react'
import {
  activeDistanceRows,
  averageDistance,
  formatKm,
  isActiveDistance,
  parseFleetPeriodSummary,
  parseLoctrackerPeriodSummary,
  sumDistance,
  type DistanceRow,
} from '../utils/periodDistance'

interface FileSlot {
  name: string
  rows: DistanceRow[]
}

const REASONS_STORAGE_KEY = 'dispatch-avg-distance-reasons-v1'

function reasonKey(row: DistanceRow): string {
  return `${row.group}:${row.plate}`
}

function loadReasons(): Record<string, string> {
  try {
    const raw = localStorage.getItem(REASONS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

async function readFile(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer()
}

export function AvgDistanceTab() {
  const [fleet, setFleet] = useState<FileSlot | null>(null)
  const [loctracker, setLoctracker] = useState<FileSlot | null>(null)
  const [error, setError] = useState('')
  const [reasons, setReasons] = useState<Record<string, string>>(loadReasons)

  useEffect(() => {
    localStorage.setItem(REASONS_STORAGE_KEY, JSON.stringify(reasons))
  }, [reasons])

  const allRows = useMemo(() => {
    return [...(fleet?.rows ?? []), ...(loctracker?.rows ?? [])]
  }, [fleet, loctracker])

  const sortedRows = useMemo(() => {
    return [...allRows].sort((a, b) => {
      const aLow = a.distance < 350
      const bLow = b.distance < 350
      if (aLow !== bLow) return aLow ? -1 : 1
      return a.distance - b.distance
    })
  }, [allRows])

  const activeRows = useMemo(() => activeDistanceRows(allRows), [allRows])
  const inactiveCount = allRows.length - activeRows.length

  const fleetAvg = useMemo(
    () => averageDistance(fleet?.rows ?? []),
    [fleet],
  )
  const locAvg = useMemo(
    () => averageDistance(loctracker?.rows ?? []),
    [loctracker],
  )
  const overallAvg = useMemo(() => averageDistance(allRows), [allRows])
  const fleetSum = useMemo(() => sumDistance(fleet?.rows ?? []), [fleet])
  const locSum = useMemo(() => sumDistance(loctracker?.rows ?? []), [loctracker])

  function setReason(row: DistanceRow, value: string) {
    const key = reasonKey(row)
    setReasons((prev) => {
      if (!value.trim()) {
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: value }
    })
  }

  async function onFleetFile(file: File | null) {
    if (!file) return
    setError('')
    try {
      const buf = await readFile(file)
      const rows = parseFleetPeriodSummary(buf)
      setFleet({ name: file.name, rows })
    } catch (e) {
      setFleet(null)
      setError(e instanceof Error ? e.message : 'Failed to read Fleet file')
    }
  }

  async function onLocFile(file: File | null) {
    if (!file) return
    setError('')
    try {
      const buf = await readFile(file)
      const rows = parseLoctrackerPeriodSummary(buf)
      setLoctracker({ name: file.name, rows })
    } catch (e) {
      setLoctracker(null)
      setError(
        e instanceof Error ? e.message : 'Failed to read Loctracker file',
      )
    }
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Avg Distance</h2>
      <p className="panel__hint">
        Fleet = <strong>FMS Distance</strong> (odometer fallback). Loctracker ={' '}
        <strong>Odometer driven distance</strong>. GPS is not used. Average
        only for active trucks (Distance &gt; 0). Under 350 km highlighted —
        add a reason.
      </p>

      <div className="upload-grid">
        <div className="upload-card">
          <h3 className="panel__subtitle">Fleet (FMS)</h3>
          <label className="upload">
            <span className="btn btn--primary">Add Fleet Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                void onFleetFile(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
          </label>
          {fleet && (
            <p className="panel__hint">
              {fleet.name} · {activeDistanceRows(fleet.rows).length} active
              {fleet.rows.some((r) => !isActiveDistance(r.distance))
                ? ` / ${fleet.rows.length} total`
                : ''}
            </p>
          )}
        </div>

        <div className="upload-card">
          <h3 className="panel__subtitle">Loctracker (Odometer)</h3>
          <label className="upload">
            <span className="btn btn--primary">Add Loctracker Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                void onLocFile(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
          </label>
          {loctracker && (
            <p className="panel__hint">
              {loctracker.name} ·{' '}
              {activeDistanceRows(loctracker.rows).length} active
              {loctracker.rows.some((r) => !isActiveDistance(r.distance))
                ? ` / ${loctracker.rows.length} total`
                : ''}
            </p>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {allRows.length > 0 && (
        <>
          <div className="stats-grid">
            <article className="stat">
              <span className="muted">Active trucks</span>
              <strong>{activeRows.length}</strong>
            </article>
            {inactiveCount > 0 && (
              <article className="stat">
                <span className="muted">0 km (excluded)</span>
                <strong>{inactiveCount}</strong>
              </article>
            )}
            <article className="stat">
              <span className="muted">Fleet avg (km)</span>
              <strong>{formatKm(fleetAvg)}</strong>
            </article>
            <article className="stat">
              <span className="muted">Fleet sum (km)</span>
              <strong>{fleet ? formatKm(fleetSum) : '—'}</strong>
            </article>
            <article className="stat">
              <span className="muted">Loctracker avg (km)</span>
              <strong>{formatKm(locAvg)}</strong>
            </article>
            <article className="stat">
              <span className="muted">Loctracker sum (km)</span>
              <strong>{loctracker ? formatKm(locSum) : '—'}</strong>
            </article>
            <article className="stat accent">
              <span className="muted">Overall avg (km)</span>
              <strong>{formatKm(overallAvg)}</strong>
            </article>
          </div>

          <div className="eta-result">
            <h3 className="panel__subtitle">Per truck</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Truck</th>
                    <th>Distance (km)</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((r) => {
                    const active = isActiveDistance(r.distance)
                    const low = r.distance < 350
                    const className = !active
                      ? 'row-inactive-distance'
                      : low
                        ? 'row-low-distance'
                        : undefined
                    const key = reasonKey(r)
                    return (
                      <tr key={key} className={className}>
                        <td>
                          {r.group === 'fleet' ? 'Fleet' : 'Loctracker'}
                        </td>
                        <td className="truck-id">{r.plate}</td>
                        <td>
                          {formatKm(r.distance)}
                          {!active ? ' · inactive' : ''}
                        </td>
                        <td>
                          {low ? (
                            <input
                              type="text"
                              className="input input--reason"
                              value={reasons[key] ?? ''}
                              onChange={(e) => setReason(r, e.target.value)}
                              placeholder="Reason"
                              aria-label={`Reason for ${r.plate}`}
                            />
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
