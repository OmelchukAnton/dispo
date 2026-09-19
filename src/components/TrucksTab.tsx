import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  addTruckToGroup,
  FLEET_CHANGED_EVENT,
  getDriverCard,
  getTruckGroup,
  loadFleetIds,
  removeTruckEverywhere,
  replaceGroupTrucks,
  saveDriverCard,
  setTruckGroup,
  splitFleetGroups,
  type TruckGroup,
} from '../data/trucks'
import {
  emptyWeeklyTruck,
  loadWeeklyTruckState,
  WEEKLY_CHANGED_EVENT,
} from '../data/weeklyTrucks'
import type {
  DriverCard,
  TruckId,
  TruckRowState,
  WeeklyTruckState,
} from '../types'
import {
  estimateParkingArrive,
  formatArriveClock,
} from '../utils/parkingEta'
import { getCmrAlertLevel, type CmrAlertLevel } from '../utils/cmrDate'
import {
  captureTablePng,
  checklistImageFileName,
  downloadDataUrl,
} from '../utils/truckChecklistExport'
import { DriverPopup } from './DriverPopup'
import { ReplaceTrucksPopup } from './ReplaceTrucksPopup'

const ETA_HOURS = Array.from({ length: 14 }, (_, i) => i + 5) // 5..18
const ETA_NOT_TODAY = 'NOT_TODAY'
const STORAGE_KEY = 'dispatch-trucks-v3'
const COL_COUNT = 12

function todayEtaSelectValue(value: string): string {
  if (!value) return ''
  if (value === ETA_NOT_TODAY) return ETA_NOT_TODAY
  return String(etaHourOf(value))
}

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
    cmr: '',
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
  raw: (Partial<TruckRowState> & {
    closeTrip?: boolean
    todayUnloading?: boolean
  }) | undefined,
): TruckRowState {
  const { closeTrip: legacyCloseTrip, todayUnloading: _tu, ...rest } =
    raw ?? {}
  void legacyCloseTrip
  void _tu
  const kmLeft = parseOptionalNumber(rest.kmLeft)
  const driveLeftHours = parseOptionalNumber(rest.driveLeftHours)
  return {
    ...emptyRow(),
    ...rest,
    updateClient: Boolean(rest.updateClient),
    unloadBy11: Boolean(rest.unloadBy11),
    todayUnloadingEta:
      typeof rest.todayUnloadingEta === 'string' ? rest.todayUnloadingEta : '',
    cmr: typeof rest.cmr === 'string' ? rest.cmr : '',
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
  | { kind: 'replace' }
  | null

export function TrucksTab() {
  const [truckIds, setTruckIds] = useState<TruckId[]>(() => loadFleetIds())
  const [rows, setRows] = useState(() => loadRows(loadFleetIds()))
  const [weeklyState, setWeeklyState] = useState(() =>
    loadWeeklyTruckState(loadFleetIds()),
  )
  const [cmrAlerts, setCmrAlerts] = useState<
    Record<string, Exclude<CmrAlertLevel, 'ok'>>
  >({})
  const [pauseSort, setPauseSort] = useState<null | 24 | 47>(null)
  const [truckQuery, setTruckQuery] = useState('')
  const [exporting, setExporting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [popup, setPopup] = useState<PopupState>(null)
  const [cardTick, setCardTick] = useState(0)
  const [groupTick, setGroupTick] = useState(0)
  const tableRef = useRef<HTMLTableElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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
      setWeeklyState((prev) => {
        const next: Record<string, WeeklyTruckState> = {}
        for (const id of ids) next[id] = prev[id] ?? emptyWeeklyTruck()
        return next
      })
    }
    function syncWeekly() {
      setWeeklyState(loadWeeklyTruckState(loadFleetIds()))
    }
    window.addEventListener(FLEET_CHANGED_EVENT, syncFleet)
    window.addEventListener(WEEKLY_CHANGED_EVENT, syncWeekly)
    return () => {
      window.removeEventListener(FLEET_CHANGED_EVENT, syncFleet)
      window.removeEventListener(WEEKLY_CHANGED_EVENT, syncWeekly)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

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

  function checkCmrDates() {
    const now = new Date()
    const next: Record<string, Exclude<CmrAlertLevel, 'ok'>> = {}
    let warn = 0
    let danger = 0
    for (const id of truckIds) {
      const cmr = normalizeRow(rows[id]).cmr.trim()
      if (!cmr) continue
      const level = getCmrAlertLevel(cmr, now)
      if (level === 'warn') {
        next[id] = 'warn'
        warn += 1
      } else if (level === 'danger') {
        next[id] = 'danger'
        danger += 1
      }
    }
    setCmrAlerts(next)
    if (warn === 0 && danger === 0) {
      window.alert('CMR OK — none older than 10 days')
    }
  }

  function clearAll() {
    if (
      !window.confirm(
        'Clear Morning Update, Arrived before 11, CMR, ETA, Safe parking, MO Refusal and New Order for every truck?',
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

  function handleReplaceList(group: TruckGroup, ids: TruckId[]) {
    const nextIds = replaceGroupTrucks(group, ids)
    setTruckIds(nextIds)
    setGroupTick((n) => n + 1)
    setRows((prev) => {
      const next: Record<string, TruckRowState> = {}
      for (const id of nextIds) next[id] = normalizeRow(prev[id])
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    setPopup(null)
  }

  const { main: mainIds, loctracker: loctrackerIds } = useMemo(() => {
    const { main, loctracker } = splitFleetGroups(truckIds)
    if (pauseSort == null) {
      return { main, loctracker }
    }
    const byPause = (ids: TruckId[]) => {
      const matched: TruckId[] = []
      const rest: TruckId[] = []
      for (const id of ids) {
        if (weeklyState[id]?.weekendRest === pauseSort) matched.push(id)
        else rest.push(id)
      }
      return [...matched, ...rest]
    }
    return {
      main: byPause(main),
      loctracker: byPause(loctracker),
    }
  }, [truckIds, groupTick, weeklyState, pauseSort])

  const truckQueryNorm = truckQuery.trim().toUpperCase().replace(/\s+/g, '')

  const { visibleMainIds, visibleLocIds } = useMemo(() => {
    if (!truckQueryNorm) {
      return { visibleMainIds: mainIds, visibleLocIds: loctrackerIds }
    }
    const matches = (id: TruckId) => {
      const plate = id.toUpperCase().replace(/\s+/g, '')
      if (plate.includes(truckQueryNorm)) return true
      const trailer = getDriverCard(id).trailer?.trim().toUpperCase().replace(/\s+/g, '')
      return Boolean(trailer && trailer.includes(truckQueryNorm))
    }
    return {
      visibleMainIds: mainIds.filter(matches),
      visibleLocIds: loctrackerIds.filter(matches),
    }
  }, [mainIds, loctrackerIds, truckQueryNorm, cardTick])

  function cyclePauseSort() {
    setPauseSort((prev) => {
      if (prev == null) return 24
      if (prev === 24) return 47
      return null
    })
  }

  async function exportChecklist() {
    const table = tableRef.current
    if (!table) return
    if (visibleMainIds.length + visibleLocIds.length === 0) {
      window.alert('No trucks to export')
      return
    }
    setExporting(true)
    try {
      // Let React apply export-hide before capture
      await new Promise<void>((r) => requestAnimationFrame(() => r()))
      const dataUrl = await captureTablePng(table)
      downloadDataUrl(dataUrl, checklistImageFileName())
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : 'Failed to capture table screenshot',
      )
    } finally {
      setExporting(false)
    }
  }

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
                <span
                  className={
                    weeklyState[id]?.weekendRest
                      ? `pause-badge pause-badge--${weeklyState[id]!.weekendRest}`
                      : 'pause-badge pause-badge--empty'
                  }
                  title={
                    weeklyState[id]?.weekendRest
                      ? 'Weekend pause (set in Weekly Instructions)'
                      : undefined
                  }
                  aria-hidden={!weeklyState[id]?.weekendRest}
                >
                  {weeklyState[id]?.weekendRest
                    ? `${weeklyState[id]!.weekendRest}h`
                    : '\u00a0'}
                </span>
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
            <td className="eta-cell">
              <select
                className="select select--compact"
                value={todayEtaSelectValue(row.todayUnloadingEta)}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') {
                    patch(id, { todayUnloadingEta: '' })
                    return
                  }
                  if (v === ETA_NOT_TODAY) {
                    patch(id, { todayUnloadingEta: ETA_NOT_TODAY })
                    return
                  }
                  const hour = Number(v)
                  patch(id, {
                    todayUnloadingEta: Number.isFinite(hour)
                      ? `${String(hour).padStart(2, '0')}:00`
                      : '',
                  })
                }}
                aria-label={`ETA time for ${id}`}
              >
                <option value="">—</option>
                <option value={ETA_NOT_TODAY} title="NOT TODAY">
                  NT
                </option>
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
            <td
              className={`cmr-cell${
                cmrAlerts[id] === 'danger'
                  ? ' cmr-cell--danger'
                  : cmrAlerts[id] === 'warn'
                    ? ' cmr-cell--warn'
                    : ''
              }`}
            >
              <input
                type="text"
                className="input input--cmr"
                value={row.cmr}
                placeholder="20.09"
                maxLength={8}
                onChange={(e) => {
                  patch(id, { cmr: e.target.value })
                  setCmrAlerts((prev) => {
                    if (!(id in prev)) return prev
                    const next = { ...prev }
                    delete next[id]
                    return next
                  })
                }}
                aria-label={`CMR date for ${id}`}
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
                  <label className="new-order__eta">
                    <span>Date</span>
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
                    <span>Time</span>
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
      <div className="panel__toolbar panel__toolbar--trucks">
        <div>
          <h2 className="panel__title">
            Trucks{' '}
            <span className="panel__title-count">
              {truckQueryNorm
                ? `${visibleMainIds.length + visibleLocIds.length}/${truckIds.length}`
                : truckIds.length}
            </span>
          </h2>
          <p className="panel__hint panel__hint--tight">
            KM left + Drive left → Calc Arrive ETA
          </p>
        </div>
        <div className="panel__toolbar-actions">
          <label className="truck-search">
            <span className="sr-only">Search truck</span>
            <input
              type="search"
              className="input input--truck-search"
              value={truckQuery}
              onChange={(e) => setTruckQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Search truck by plate"
            />
            {truckQuery && (
              <button
                type="button"
                className="truck-search__clear"
                onClick={() => setTruckQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>
          <div
            className={`unload-stat ${unloadBy11Count > 0 ? 'unload-stat--active' : ''}`}
            title="Trucks arrived before 11:00"
          >
            <span className="unload-stat__label">Before 11</span>
            <strong className="unload-stat__value">{unloadBy11Count}</strong>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setPopup({ kind: 'add' })}
          >
            Add truck
          </button>
          <div className="toolbar-menu" ref={menuRef}>
            <button
              type="button"
              className="btn btn--icon"
              aria-label="More actions"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="toolbar-menu__panel" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="toolbar-menu__item"
                  disabled={exporting}
                  onClick={() => {
                    setMenuOpen(false)
                    void exportChecklist()
                  }}
                >
                  {exporting ? 'Export…' : 'Export screenshot'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="toolbar-menu__item"
                  onClick={() => {
                    setMenuOpen(false)
                    setPopup({ kind: 'replace' })
                  }}
                >
                  Replace list
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="toolbar-menu__item toolbar-menu__item--danger"
                  onClick={() => {
                    setMenuOpen(false)
                    clearAll()
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table
          ref={tableRef}
          className="data-table data-table--trucks"
        >
          <thead>
            <tr>
              <th>
                <div className="th-pause-sort">
                  <span>Trucks</span>
                  <button
                    type="button"
                    className={`pause-sort-btn export-hide${
                      pauseSort != null
                        ? ` pause-sort-btn--${pauseSort} is-active`
                        : ''
                    }`}
                    onClick={cyclePauseSort}
                    title={
                      pauseSort == null
                        ? 'Sort: off → click for 24h on top'
                        : pauseSort === 24
                          ? 'Sort: 24h on top → click for 47h'
                          : 'Sort: 47h on top → click to cancel'
                    }
                    aria-label={
                      pauseSort == null
                        ? 'Pause sort off'
                        : `Pause sort ${pauseSort}h`
                    }
                  >
                    {pauseSort == null ? '↕' : `${pauseSort}h`}
                  </button>
                </div>
              </th>
              <th className="th-stack">
                <span>Morning</span>
                <span>Update</span>
              </th>
              <th className="th-stack">
                <span>Arrived</span>
                <span>before 11</span>
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
              <th className="th-cmr">
                <span>CMR</span>
                <div className="cmr-check-actions export-hide">
                  <button
                    type="button"
                    className="btn btn--ghost btn--tiny btn--cmr-check"
                    title="Check CMR dates (>10 yellow, >14 red border)"
                    onClick={checkCmrDates}
                    aria-label="Check CMR dates"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--tiny btn--cmr-check"
                    title="Clear CMR highlights"
                    onClick={() => setCmrAlerts({})}
                    aria-label="Clear CMR highlights"
                  >
                    ×
                  </button>
                </div>
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
            {visibleMainIds.length > 0 && (
              <tr className="fleet-group-row">
                <td colSpan={COL_COUNT}>Fleet</td>
              </tr>
            )}
            {renderTruckRows(visibleMainIds)}
            {visibleLocIds.length > 0 && (
              <tr className="fleet-group-row fleet-group-row--loctracker">
                <td colSpan={COL_COUNT}>Loctracker</td>
              </tr>
            )}
            {renderTruckRows(visibleLocIds)}
            {truckQueryNorm &&
              visibleMainIds.length === 0 &&
              visibleLocIds.length === 0 && (
                <tr>
                  <td colSpan={COL_COUNT} className="muted">
                    No trucks match “{truckQuery.trim()}”
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {popup?.kind === 'replace' && (
        <ReplaceTrucksPopup
          fleetIds={mainIds}
          locIds={loctrackerIds}
          onClose={() => setPopup(null)}
          onReplace={handleReplaceList}
        />
      )}
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
