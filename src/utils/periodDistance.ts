import * as XLSX from 'xlsx'

export type DistanceGroup = 'fleet' | 'loctracker'

export interface DistanceRow {
  group: DistanceGroup
  plate: string
  distance: number
  label: string
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').replace(/\s/g, '').trim()
    if (!cleaned || cleaned === '--' || cleaned === '-') return null
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function cellStr(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

/** Extract plate from "NJO636/MM670 …" or "AFI363 / RP968 …" */
export function plateFromDeviceName(name: string): string {
  const raw = name.trim()
  if (!raw) return ''
  const beforeSlash = raw.split(/[/–—-]/)[0]?.trim() ?? raw
  const token = beforeSlash.split(/\s+/)[0] ?? beforeSlash
  return token.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function sheetToMatrix(file: ArrayBuffer): unknown[][] {
  const wb = XLSX.read(file, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) throw new Error('Workbook has no sheets')
  return XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    defval: '',
    raw: true,
  }) as unknown[][]
}

function findHeaderRow(
  rows: unknown[][],
  required: string[],
): { index: number; headers: string[] } | null {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const headers = (rows[i] ?? []).map((c) => cellStr(c).toLowerCase())
    if (required.every((r) => headers.some((h) => h === r.toLowerCase()))) {
      return { index: i, headers: (rows[i] ?? []).map((c) => cellStr(c)) }
    }
  }
  return null
}

/**
 * Fleet Period Summary (.xls): FMS Distance (2nd "Distance"), else odometer delta.
 */
export function parseFleetPeriodSummary(file: ArrayBuffer): DistanceRow[] {
  const rows = sheetToMatrix(file)
  const header = findHeaderRow(rows, ['License plate', 'Distance'])
  if (!header) {
    throw new Error(
      'Fleet file: expected columns "License plate" and "Distance"',
    )
  }

  const plateIdx = header.headers.findIndex(
    (h) => h.toLowerCase() === 'license plate',
  )
  const distanceIndexes = header.headers
    .map((h, i) => (h.toLowerCase() === 'distance' ? i : -1))
    .filter((i) => i >= 0)
  if (!distanceIndexes.length) {
    throw new Error('Fleet file: no Distance columns found')
  }
  // FMS Distance = second Distance column (under "FMS data")
  const fmsIdx =
    distanceIndexes.length >= 2 ? distanceIndexes[1]! : distanceIndexes[0]!

  const odoCols = findOdometerStartEnd(rows, header.index, header.headers)

  const out: DistanceRow[] = []
  for (let r = header.index + 1; r < rows.length; r++) {
    const row = rows[r] ?? []
    const plate = cellStr(row[plateIdx]).toUpperCase().replace(/\s+/g, '')
    if (!plate || plate === 'TOTAL' || plate === 'VEHICLE') continue

    const fms = toNumber(row[fmsIdx])
    let odoDelta: number | null = null
    if (odoCols) {
      const start = toNumber(row[odoCols.start])
      const end = toNumber(row[odoCols.end])
      if (start != null && end != null) odoDelta = end - start
    }

    // Prefer FMS Distance; fall back to odometer (end − start)
    const distance = fms ?? odoDelta
    if (distance == null) continue
    out.push({
      group: 'fleet',
      plate,
      distance,
      label: plate,
    })
  }
  if (!out.length) throw new Error('Fleet file: no truck distance rows found')
  return out
}

/** Locate Odometer "At period start" / "At period end" under the Odometer data section. */
function findOdometerStartEnd(
  rows: unknown[][],
  headerIndex: number,
  headers: string[],
): { start: number; end: number } | null {
  const sectionRow = headerIndex > 0 ? rows[headerIndex - 1] ?? [] : []
  let odoSection = -1
  for (let i = 0; i < sectionRow.length; i++) {
    if (cellStr(sectionRow[i]).toLowerCase() === 'odometer data') {
      odoSection = i
      break
    }
  }

  const startEnds: number[] = []
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].toLowerCase() === 'at period start') startEnds.push(i)
  }

  if (odoSection >= 0) {
    const start = startEnds.find((i) => i >= odoSection)
    if (start != null && headers[start + 1]?.toLowerCase() === 'at period end') {
      return { start, end: start + 1 }
    }
  }

  // Fallback: middle pair of start/end (Fuel / Odometer / Fuel level)
  if (startEnds.length >= 2) {
    const start = startEnds[1]!
    if (headers[start + 1]?.toLowerCase() === 'at period end') {
      return { start, end: start + 1 }
    }
  }
  return null
}

/**
 * Loctracker Period summary (.xlsx): Odometer driven distance only (no GPS).
 */
export function parseLoctrackerPeriodSummary(file: ArrayBuffer): DistanceRow[] {
  const rows = sheetToMatrix(file)
  const header = findHeaderRow(rows, [
    'Device name',
    'Odometer driven distance (km)',
  ])
  if (!header) {
    throw new Error(
      'Loctracker file: expected "Device name" and "Odometer driven distance (km)"',
    )
  }

  const nameIdx = header.headers.findIndex(
    (h) => h.toLowerCase() === 'device name',
  )
  const odoIdx = header.headers.findIndex(
    (h) => h.toLowerCase() === 'odometer driven distance (km)',
  )

  const out: DistanceRow[] = []
  for (let r = header.index + 1; r < rows.length; r++) {
    const row = rows[r] ?? []
    const device = cellStr(row[nameIdx])
    if (!device) continue
    if (/^total$/i.test(device.trim())) continue
    const plate = plateFromDeviceName(device)
    if (!plate) continue
    const distance = toNumber(row[odoIdx])
    if (distance == null) continue
    out.push({
      group: 'loctracker',
      plate,
      distance,
      label: plate,
    })
  }
  if (!out.length) {
    throw new Error('Loctracker file: no truck distance rows found')
  }
  return out
}

export function isActiveDistance(distance: number): boolean {
  return Number.isFinite(distance) && distance > 0
}

export function activeDistanceRows(rows: DistanceRow[]): DistanceRow[] {
  return rows.filter((r) => isActiveDistance(r.distance))
}

export function averageDistance(rows: DistanceRow[]): number | null {
  const active = activeDistanceRows(rows)
  if (!active.length) return null
  const sum = active.reduce((acc, r) => acc + r.distance, 0)
  return sum / active.length
}

export function sumDistance(rows: DistanceRow[]): number {
  return activeDistanceRows(rows).reduce((acc, r) => acc + r.distance, 0)
}

export function formatKm(value: number | null, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toFixed(digits)
}
