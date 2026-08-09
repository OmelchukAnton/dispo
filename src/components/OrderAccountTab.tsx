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
  /** How many unloading stops were merged into this one count. */
  stops: number
  /** All Waiting from / arrival times for this truck on that day. */
  arrivedTimes: Date[]
}

interface OrderReport {
  fileName: string
  totalRows: number
  totalUnloadings: number
  beforeNoonTotal: number
  overFourHoursCount: number
  overFourHoursLoading: number
  overFourHoursUnloading: number
  groupageCount: number
  days: DayStats[]
  rows: OrderRow[]
  overtimeRows: OrderRow[]
  groupageRows: GroupageRow[]
}

interface GroupageRow {
  plate: string
  dateKey: string
  dateLabel: string
  loadingMinutes: number
  unloadingMinutes: number
  totalMinutes: number
  orderNumber: string
}

const GROUPAGE_MINUTES = 3 * 60 // 180

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
  const overtimeRows: OrderRow[] = []
  const dayMap = new Map<string, DayStats>()

  let overFourHoursLoading = 0
  let overFourHoursUnloading = 0

  // plate|yyyy-MM-dd → merged unloading
  const unloadGroups = new Map<string, OrderRow>()

  // plate|yyyy-MM-dd → Loading + Unloading minutes for groupage
  const dayOps = new Map<
    string,
    {
      plate: string
      dateKey: string
      loadingMinutes: number
      unloadingMinutes: number
      orders: string[]
    }
  >()

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
      stops: 1,
      arrivedTimes: fields.waitingFrom ? [fields.waitingFrom] : [],
    }

    // Extra: list trucks with Loading or Unloading > 4h (per stop)
    if (overFourHours) {
      overtimeRows.push(orderRow)
      if (isLoading) overFourHoursLoading += 1
      if (isUnloading) overFourHoursUnloading += 1
    }

    // Groupage: same truck, same day — sum Loading + Unloading minutes
    const opDate = fields.waitingFrom ?? fields.waitingTill
    if (opDate && fields.waitingMinutes != null && fields.waitingMinutes > 0) {
      const plate =
        fields.plate.toUpperCase().replace(/\s+/g, '') ||
        fields.vehicle.toUpperCase().replace(/\s+/g, '')
      if (plate) {
        const dateKey = format(opDate, 'yyyy-MM-dd')
        const key = `${plate}|${dateKey}`
        const op = dayOps.get(key) ?? {
          plate,
          dateKey,
          loadingMinutes: 0,
          unloadingMinutes: 0,
          orders: [],
        }
        if (isLoading) op.loadingMinutes += fields.waitingMinutes
        if (isUnloading) op.unloadingMinutes += fields.waitingMinutes
        if (fields.orderNumber && !op.orders.includes(fields.orderNumber)) {
          op.orders.push(fields.orderNumber)
        }
        dayOps.set(key, op)
      }
    }

    // Main unloadings: Unloading + Waiting from, 1 per truck per day
    if (!isUnloading || !fields.waitingFrom) continue

    const plate = fields.plate.toUpperCase() || fields.vehicle.toUpperCase()
    const dateKey = format(fields.waitingFrom, 'yyyy-MM-dd')
    const groupKey = `${plate}|${dateKey}`
    const existing = unloadGroups.get(groupKey)

    if (!existing) {
      unloadGroups.set(groupKey, {
        ...orderRow,
        stops: 1,
        arrivedTimes: [fields.waitingFrom],
      })
      continue
    }

    // Merge extra stops into one unloading for the day
    existing.stops += 1
    existing.arrivedTimes.push(fields.waitingFrom)
    existing.arrivedTimes.sort((a, b) => a.getTime() - b.getTime())

    const existingFrom = existing.waitingFrom?.getTime() ?? Number.POSITIVE_INFINITY
    const nextFrom = fields.waitingFrom.getTime()
    if (nextFrom < existingFrom) {
      existing.waitingFrom = fields.waitingFrom
      existing.waitingTill = fields.waitingTill
      existing.waitingMinutes = fields.waitingMinutes
      existing.orderNumber = fields.orderNumber
      existing.vehicle = fields.vehicle
      existing.overFourHours = overFourHours || existing.overFourHours
    } else if (overFourHours) {
      existing.overFourHours = true
    }
    if (
      fields.orderNumber &&
      existing.orderNumber &&
      !existing.orderNumber.includes(fields.orderNumber)
    ) {
      existing.orderNumber = `${existing.orderNumber}, ${fields.orderNumber}`
    }
  }

  const groupageRows: GroupageRow[] = [...dayOps.values()]
    .map((op) => {
      const totalMinutes = op.loadingMinutes + op.unloadingMinutes
      return {
        plate: op.plate,
        dateKey: op.dateKey,
        dateLabel: format(parse(op.dateKey, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy'),
        loadingMinutes: op.loadingMinutes,
        unloadingMinutes: op.unloadingMinutes,
        totalMinutes,
        orderNumber: op.orders.join(', '),
      }
    })
    .filter((g) => {
      if (
        !(
          g.loadingMinutes > 0 &&
          g.unloadingMinutes > 0 &&
          g.totalMinutes > GROUPAGE_MINUTES
        )
      ) {
        return false
      }
      // Skip if this truck/day already counted in >4h overtime
      const alreadyOverFour = overtimeRows.some((r) => {
        const plate = (r.plate || r.vehicle).toUpperCase().replace(/\s+/g, '')
        const d = r.waitingFrom ?? r.waitingTill
        if (!plate || !d) return false
        return plate === g.plate && format(d, 'yyyy-MM-dd') === g.dateKey
      })
      return !alreadyOverFour
    })
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.plate.localeCompare(b.plate))

  const unloadingRows = [...unloadGroups.values()].sort((a, b) => {
    const ta = a.waitingFrom?.getTime() ?? 0
    const tb = b.waitingFrom?.getTime() ?? 0
    return ta - tb
  })

  let totalUnloadings = 0
  let beforeNoonTotal = 0

  for (const row of unloadingRows) {
    if (!row.waitingFrom) continue
    totalUnloadings += 1

    const dateKey = format(row.waitingFrom, 'yyyy-MM-dd')
    const dateLabel = format(row.waitingFrom, 'dd/MM/yyyy')
    const day = dayMap.get(dateKey) ?? {
      dateKey,
      dateLabel,
      unloadings: 0,
      beforeNoon: 0,
    }
    day.unloadings += 1
    if (isBeforeNoon(row.waitingFrom)) {
      day.beforeNoon += 1
      beforeNoonTotal += 1
    }
    dayMap.set(dateKey, day)
  }

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
    groupageCount: groupageRows.length,
    days,
    rows: unloadingRows,
    overtimeRows,
    groupageRows,
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
        Counts Unloading by Waiting from (= Arrived). Multiple stops of the same
        truck on the same day count as 1 unloading. Before 12:00 uses the first
        arrival. Also lists Loading/Unloading &gt; 4h. Same truck with Loading +
        Unloading &gt; 3h total in one day → Unloading + Loading (skipped if
        already in &gt;4h list).
      </p>

      <label className="upload">
        <span className="btn btn--primary">Add Excel file</span>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            void onFile(e.target.files?.[0] ?? null)
            e.target.value = ''
          }}
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
            <article className="stat accent">
              <span className="muted">Unloading + Loading (&gt;3h)</span>
              <strong>{report.groupageCount}</strong>
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
              Unloading + Loading &gt; 3h ({report.groupageCount})
            </h3>
            {report.groupageRows.length === 0 ? (
              <p className="panel__hint">
                No truck with Loading + Unloading over 3 hours the same day.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Plate</th>
                      <th>Task</th>
                      <th>Date</th>
                      <th>Loading</th>
                      <th>Unloading</th>
                      <th>Total</th>
                      <th>Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.groupageRows.map((r) => (
                      <tr
                        key={`grp-${r.plate}-${r.dateKey}`}
                        className="row-groupage"
                      >
                        <td className="truck-id">{r.plate}</td>
                        <td>Unloading + Loading</td>
                        <td>{r.dateLabel}</td>
                        <td>{formatDuration(r.loadingMinutes)}</td>
                        <td>{formatDuration(r.unloadingMinutes)}</td>
                        <td>{formatDuration(r.totalMinutes)} ⚠ &gt;3h</td>
                        <td>{r.orderNumber || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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
            <h3 className="panel__subtitle">
              Unloadings (1 per truck / day) — after 12:00 highlighted
            </h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plate</th>
                    <th>Arrived (Waiting from)</th>
                    <th>Before 12:00</th>
                    <th>Stops</th>
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
                    const arrivedLabel =
                      r.arrivedTimes.length > 0
                        ? r.arrivedTimes
                            .map((t) => format(t, 'dd/MM/yyyy HH:mm'))
                            .join(' · ')
                        : r.waitingFrom
                          ? format(r.waitingFrom, 'dd/MM/yyyy HH:mm')
                          : '—'
                    const rowClass = r.overFourHours
                      ? 'row-overtime'
                      : !beforeNoon
                        ? 'row-after-noon'
                        : undefined
                    return (
                      <tr
                        key={`${r.plate}-${r.orderNumber}-${idx}`}
                        className={rowClass}
                      >
                        <td className="truck-id">{r.plate || '—'}</td>
                        <td className="arrived-cell">{arrivedLabel}</td>
                        <td>{beforeNoon ? 'Yes' : 'No'}</td>
                        <td>{r.stops}</td>
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
