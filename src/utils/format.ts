import { format } from 'date-fns'

export function formatDateTime(date: Date): string {
  return format(date, 'dd/MM/yyyy, HH:mm')
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function parseTimeInput(value: string, base = new Date()): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  // HH:mm
  const hm = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (hm) {
    const h = Number(hm[1])
    const m = Number(hm[2])
    if (h < 0 || h > 23 || m < 0 || m > 59) return null
    const d = new Date(base)
    d.setHours(h, m, 0, 0)
    return d
  }

  // dd/MM/yyyy HH:mm or dd/MM/yyyy, HH:mm
  const full =
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})[,\s]+(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (full) {
    const day = Number(full[1])
    const month = Number(full[2]) - 1
    const year = Number(full[3])
    const h = Number(full[4])
    const m = Number(full[5])
    const d = new Date(year, month, day, h, m, 0, 0)
    return Number.isNaN(d.getTime()) ? null : d
  }

  return null
}
