import { useState } from 'react'
import * as XLSX from 'xlsx'
import { format, isValid, parse } from 'date-fns'

interface DayStats {
  dateKey: string
  dateLabel: string
  unloadings: number
  beforeNoon: number
}

interface OrderRow {
  vehicle: string
  plate: string
  orderNumber: string
  taskType: string
  waitingFrom: Date | null
  waitingTill: Date | null
  waitingMinutes: number | null
  overFourHours: boolean
}

interface OrderReport {
  fileName: string
  totalRows: number
  totalUnloadings: number
  beforeNoonTotal: number
  overFourHoursCount: number
  overFourHoursLoading: number
  overFourHoursUnloading: number
  days: DayStats[]
  rows: OrderRow[]
  overtimeRows: OrderRow[]
}

function findKey(row: Record<string, unknown>, names: string[]): string | null {
  const keys = Object.keys(row)
  for (const name of names) {
    const found = keys.find((k) => k.trim().toLowerCase() === name.toLowerCase())
    if (found) return found
  }
  return null
}

function cellToDate(value: unknown): Date | null {
  if (value == null || value === '') return null

  if (value instanceof Date && isValid(value)) return value

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) return null
    return new Date(
      parsed.y,
      parsed.m - 1,
      parsed.d,
      parsed.H || 0,
      parsed.M || 0,
      parsed.S || 0,
    )
  }

  if (typeof value === 'string') {
    const raw = value.trim()
    const formats = [
      'yyyy-MM-dd HH:mm',
      'yyyy-MM-dd HH:mm:ss',
      'dd.MM.yyyy HH:mm',
      'dd/MM/yyyy HH:mm',
      'dd.MM.yyyy HH:mm:ss',
      'dd/MM/yyyy HH:mm:ss',
    ]
    for (const f of formats) {
      const d = parse(raw, f, new Date())
      if (isValid(d)) return d
    }
  }

  return null
}

function parseDurationMinutes(value: unknown): number | null {
  if (value == null || value === '') return null

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 0 && value < 2) return Math.round(value * 24 * 60)
    return Math.round(value)
  }

  if (typeof value === 'string') {
    const raw = value.trim()
    const hm = /^(\d+):(\d{2})(?::(\d{2}))?$/.exec(raw)
    if (hm) {
      const h = Number(hm[1])
      const m = Number(hm[2])
      const s = Number(hm[3] || 0)
      return h * 60 + m + Math.round(s / 60)
    }
  }

  return null
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function isBeforeNoon(date: Date): boolean {
  return date.getHours() < 12
}

function readRowFields(row: Record<string, unknown>) {
  const taskKey = findKey(row, ['Task type', 'Task Type', 'Type'])
  const fromKey = findKey(row, ['Waiting from', 'Waiting From'])
  const tillKey = findKey(row, ['Waiting till', 'Waiting Till'])
  const totalKey = findKey(row, [
    'Waiting time total',
    'Waiting Time Total',
    'Waiting time',
  ])
  const vehicleKey = findKey(row, ['Vehicle'])
  const plateKey = findKey(row, ['License plate', 'License Plate', 'Plate'])
  const orderKey = findKey(row, ['Order number', 'Order Number', 'Order'])

  const taskType = String(taskKey ? row[taskKey] : '').trim()
  const waitingFrom = fromKey ? cellToDate(row[fromKey]) : null
  const waitingTill = tillKey ? cellToDate(row[tillKey]) : null

  let waitingMinutes = totalKey ? parseDurationMinutes(row[totalKey]) : null
  if (
    waitingMinutes == null &&
    waitingFrom &&
    waitingTill &&
    waitingTill >= waitingFrom
  ) {
    waitingMinutes = Math.round(
      (waitingTill.getTime() - waitingFrom.getTime()) / 60000,
    )
  }

  return {
    taskType,
    waitingFrom,
    waitingTill,
    waitingMinutes,
    vehicle: String(vehicleKey ? row[vehicleKey] : ''),
    plate: String(plateKey ? row[plateKey] : '').trim(),
    orderNumber: String(orderKey ? row[orderKey] : ''),
  }
}

function analyzeRows(rows: Record<string, unknown>[]): Omit<OrderReport, 'fileName'> {
  const unloadingRows: OrderRow[] = []
  const overtimeRows: OrderRow[] = []
  const dayMap = new Map<string, DayStats>()

  let totalUnloadings = 0
  let beforeNoonTotal = 0
  let overFourHoursLoading = 0
  let overFourHoursUnloading = 0

  for (const row of rows) {
    const fields = readRowFields(row)
    const task = fields.taskType.toLowerCase()
    const isLoading = task === 'loading'
    const isUnloading = task === 'unloading'
    if (!isLoading && !isUnloading) continue

    const overFourHours =
      fields.waitingMinutes != null && fields.waitingMinutes > 4 * 60

    const orderRow: OrderRow = {
      vehicle: fields.vehicle,
      plate: fields.plate,
      orderNumber: fields.orderNumber,
      taskType: fields.taskType,
      waitingFrom: fields.waitingFrom,
      waitingTill: fields.waitingTill,
      waitingMinutes: fields.waitingMinutes,
      overFourHours,
    }

    // Extra: list trucks with Loading or Unloading > 4h
    if (overFourHours) {
      overtimeRows.push(orderRow)
      if (isLoading) overFourHoursLoading += 1
      if (isUnloading) overFourHoursUnloading += 1
    }

    // Main unloadings account: only Unloading + Waiting from
    if (!isUnloading || !fields.waitingFrom) continue

    totalUnloadings += 1

    const dateKey = format(fields.waitingFrom, 'yyyy-MM-dd')
    const dateLabel = format(fields.waitingFrom, 'dd/MM/yyyy')
    const day = dayMap.get(dateKey) ?? {
      dateKey,
      dateLabel,
      unloadings: 0,
      beforeNoon: 0,
    }
    day.unloadings += 1
    if (isBeforeNoon(fields.waitingFrom)) {
      day.beforeNoon += 1
      beforeNoonTotal += 1
    }
    dayMap.set(dateKey, day)

    unloadingRows.push(orderRow)
  }

  unloadingRows.sort((a, b) => {
    const ta = a.waitingFrom?.getTime() ?? 0
    const tb = b.waitingFrom?.getTime() ?? 0
    return ta - tb
  })

  overtimeRows.sort((a, b) => {
    const ta = a.waitingFrom?.getTime() ?? 0
    const tb = b.waitingFrom?.getTime() ?? 0
    return ta - tb
  })

  const days = [...dayMap.values()].sort((a, b) =>
    a.dateKey.localeCompare(b.dateKey),
  )

  return {
    totalRows: rows.length,
    totalUnloadings,
    beforeNoonTotal,
    overFourHoursCount: overtimeRows.length,
    overFourHoursLoading,
    overFourHoursUnloading,
    days,
    rows: unloadingRows,
    overtimeRows,
  }
}

export function OrderAccountTab() {
  const [report, setReport] = useState<OrderReport | null>(null)
  const [error, setError] = useState('')

  async function onFile(file: File | null) {
    if (!file) return
    setError('')
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        setError('Excel file has no sheets')
        setReport(null)
        return
      }
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      })

      if (!rows.length) {
        setError('No rows found in Excel')
        setReport(null)
        return
      }

      const hasWaitingFrom = Object.keys(rows[0]).some(
        (k) => k.trim().toLowerCase() === 'waiting from',
      )
      if (!hasWaitingFrom) {
        setError('Column "Waiting from" not found')
        setReport(null)
        return
      }

      const analyzed = analyzeRows(rows)
      setReport({ fileName: file.name, ...analyzed })
    } catch (e) {
      setReport(null)
      setError(e instanceof Error ? e.message : 'Failed to read Excel file')
    }
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Order Account</h2>
      <p className="panel__hint">
        Main count: Unloading by Waiting from (before 12:00 / by day).
        Additionally lists trucks with Loading or Unloading longer than 4 hours.
      </p>

      <label className="upload">
        <span className="btn btn--primary">Add Excel file</span>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {error && <p className="error">{error}</p>}

      {report && (
        <>
          <div className="stats-grid">
            <article className="stat">
              <span className="muted">File</span>
              <strong>{report.fileName}</strong>
            </article>
            <article className="stat">
              <span className="muted">Rows read</span>
              <strong>{report.totalRows}</strong>
            </article>
            <article className="stat accent">
              <span className="muted">Total unloadings</span>
              <strong>{report.totalUnloadings}</strong>
            </article>
            <article className="stat accent">
              <span className="muted">Unloading before 12:00</span>
              <strong>{report.beforeNoonTotal}</strong>
            </article>
            <article className="stat warn">
              <span className="muted">Loading &gt; 4h</span>
              <strong>{report.overFourHoursLoading}</strong>
            </article>
            <article className="stat warn">
              <span className="muted">Unloading &gt; 4h</span>
              <strong>{report.overFourHoursUnloading}</strong>
            </article>
          </div>

          {report.days.length > 0 && (
            <div className="eta-result">
              <h3 className="panel__subtitle">By day (Waiting from)</h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Unloadings</th>
                      <th>Before 12:00</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.days.map((d) => (
                      <tr key={d.dateKey}>
                        <td>{d.dateLabel}</td>
                        <td>{d.unloadings}</td>
                        <td>{d.beforeNoon}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="eta-result">
            <h3 className="panel__subtitle">
              Loading / Unloading &gt; 4 hours ({report.overFourHoursCount})
            </h3>
            {report.overtimeRows.length === 0 ? (
              <p className="panel__hint">No Loading or Unloading over 4 hours.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Plate</th>
                      <th>Task</th>
                      <th>Waiting from</th>
                      <th>Waiting till</th>
                      <th>Duration</th>
                      <th>Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.overtimeRows.map((r, idx) => (
                      <tr
                        key={`ot-${r.orderNumber}-${idx}`}
                        className="row-overtime"
                      >
                        <td className="truck-id">{r.plate || '—'}</td>
                        <td>{r.taskType}</td>
                        <td>
                          {r.waitingFrom
                            ? format(r.waitingFrom, 'dd/MM/yyyy HH:mm')
                            : '—'}
                        </td>
                        <td>
                          {r.waitingTill
                            ? format(r.waitingTill, 'dd/MM/yyyy HH:mm')
                            : '—'}
                        </td>
                        <td>{formatDuration(r.waitingMinutes)} ⚠ &gt;4h</td>
                        <td>{r.orderNumber || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="eta-result">
            <h3 className="panel__subtitle">Unloadings (Waiting from)</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plate</th>
                    <th>Waiting from</th>
                    <th>Before 12:00</th>
                    <th>Waiting till</th>
                    <th>Duration</th>
                    <th>Order</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r, idx) => {
                    const beforeNoon = r.waitingFrom
                      ? isBeforeNoon(r.waitingFrom)
                      : false
                    return (
                      <tr
                        key={`${r.orderNumber}-${idx}`}
                        className={r.overFourHours ? 'row-overtime' : undefined}
                      >
                        <td className="truck-id">{r.plate || '—'}</td>
                        <td>
                          {r.waitingFrom
                            ? format(r.waitingFrom, 'dd/MM/yyyy HH:mm')
                            : '—'}
                        </td>
                        <td>{beforeNoon ? 'Yes' : 'No'}</td>
                        <td>
                          {r.waitingTill
                            ? format(r.waitingTill, 'dd/MM/yyyy HH:mm')
                            : '—'}
                        </td>
                        <td>
                          {formatDuration(r.waitingMinutes)}
                          {r.overFourHours ? ' ⚠ >4h' : ''}
                        </td>
                        <td>{r.orderNumber || '—'}</td>
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
