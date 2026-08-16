import { useEffect, useMemo, useState } from 'react'
import {
  FLEET_CHANGED_EVENT,
  loadFleetIds,
  splitFleetGroups,
} from '../data/trucks'
import type {
  TruckId,
  WeeklyInstructionForm,
  WeeklyMondayAction,
  WeeklyTodayKind,
  WeeklyTonightPause,
  WeeklyTomorrowGoal,
  WeeklyTruckState,
} from '../types'
import {
  buildWeeklyMessage,
  defaultWeeklyForm,
} from '../utils/weeklyInstructions'

const STORAGE_KEY = 'dispatch-weekly-v1'

function emptyTruck(): WeeklyTruckState {
  return { sent: false }
}

function loadTruckState(ids: TruckId[]): Record<string, WeeklyTruckState> {
  const raw = localStorage.getItem(STORAGE_KEY)
  let parsed: Record<string, WeeklyTruckState> = {}
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, WeeklyTruckState>
    } catch {
      parsed = {}
    }
  }
  const init: Record<string, WeeklyTruckState> = {}
  for (const id of ids) init[id] = parsed[id] ?? emptyTruck()
  return init
}

export function WeeklyInstructionsTab() {
  const [form, setForm] = useState<WeeklyInstructionForm>(() =>
    defaultWeeklyForm(),
  )
  const [message, setMessage] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [truckIds, setTruckIds] = useState<TruckId[]>(() => loadFleetIds())
  const [truckState, setTruckState] = useState(() =>
    loadTruckState(loadFleetIds()),
  )

  useEffect(() => {
    function syncFleet() {
      const ids = loadFleetIds()
      setTruckIds(ids)
      setTruckState((prev) => {
        const next: Record<string, WeeklyTruckState> = {}
        for (const id of ids) next[id] = prev[id] ?? emptyTruck()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    }
    window.addEventListener(FLEET_CHANGED_EVENT, syncFleet)
    return () => window.removeEventListener(FLEET_CHANGED_EVENT, syncFleet)
  }, [])

  function persist(next: Record<string, WeeklyTruckState>) {
    setTruckState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function patchForm(partial: Partial<WeeklyInstructionForm>) {
    setForm((prev) => {
      const next = { ...prev, ...partial }
      // Long pause: default tonight to pull chip if still on 9h from short template
      if (partial.pauseKind === 'long' && prev.pauseKind === 'short') {
        if (prev.tonightPause === '9' || prev.tonightPause === '11') {
          next.tonightPause = 'pull_chip'
        }
        next.envelopes = true
      }
      if (partial.pauseKind === 'short' && prev.pauseKind === 'long') {
        if (prev.tonightPause === 'pull_chip') next.tonightPause = '9'
      }
      return next
    })
  }

  function generate() {
    setMessage(buildWeeklyMessage(form))
  }

  async function copyForTruck(id: TruckId) {
    const text = message || buildWeeklyMessage(form)
    if (!message) setMessage(text)
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      const current = truckState[id] ?? emptyTruck()
      persist({ ...truckState, [id]: { ...current, sent: true } })
      window.setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // ignore clipboard errors
    }
  }

  function toggleSent(id: TruckId) {
    const current = truckState[id] ?? emptyTruck()
    persist({
      ...truckState,
      [id]: { ...current, sent: !current.sent },
    })
  }

  const sentCount = useMemo(
    () => truckIds.filter((id) => truckState[id]?.sent).length,
    [truckState, truckIds],
  )

  function clearAllSent() {
    if (sentCount === 0) return
    if (
      !window.confirm(
        `Clear sent mark for ${sentCount} truck${sentCount === 1 ? '' : 's'}?`,
      )
    ) {
      return
    }
    const next = { ...truckState }
    for (const id of truckIds) {
      next[id] = { ...(next[id] ?? emptyTruck()), sent: false }
    }
    persist(next)
  }

  const { main: mainIds, loctracker: loctrackerIds } = useMemo(
    () => splitFleetGroups(truckIds),
    [truckIds],
  )

  function renderFleet(ids: TruckId[]) {
    return ids.map((id) => {
      const state = truckState[id] ?? emptyTruck()
      return (
        <li key={id} className="fleet-chip fleet-chip--weekly">
          <button
            type="button"
            className={`fleet-truck ${state.sent ? 'is-sent' : ''}`}
            onClick={() => toggleSent(id)}
            title="Click to mark sent"
          >
            {id}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--tiny"
            onClick={() => void copyForTruck(id)}
          >
            {copiedId === id ? 'Copied' : 'Copy'}
          </button>
        </li>
      )
    })
  }

  return (
    <section className="panel panel--instructions">
      <div className="calc-card">
        <h2 className="panel__title">Weekly Instructions</h2>
        <p className="panel__hint">
          Short (24–44h with chip) or long (47h+ without chip). Generate once,
          then Copy per truck.
        </p>

        <div className="instructions-form">
          <fieldset className="fieldset">
            <legend>Language</legend>
            <label className="radio">
              <input
                type="radio"
                name="weekly-lang"
                checked={form.lang === 'en'}
                onChange={() => patchForm({ lang: 'en' })}
              />
              EN
            </label>
            <label className="radio">
              <input
                type="radio"
                name="weekly-lang"
                checked={form.lang === 'ru'}
                onChange={() => patchForm({ lang: 'ru' })}
              />
              RU
            </label>
          </fieldset>

          <fieldset className="fieldset">
            <legend>Pause type</legend>
            <label className="radio">
              <input
                type="radio"
                name="weekly-pause"
                checked={form.pauseKind === 'short'}
                onChange={() => patchForm({ pauseKind: 'short' })}
              />
              Short 24–44h + chip
            </label>
            <label className="radio">
              <input
                type="radio"
                name="weekly-pause"
                checked={form.pauseKind === 'long'}
                onChange={() => patchForm({ pauseKind: 'long' })}
              />
              Long 47h+ no chip
            </label>
          </fieldset>

          <fieldset className="fieldset">
            <legend>Today</legend>
            <select
              className="select"
              value={form.todayKind}
              onChange={(e) =>
                patchForm({ todayKind: e.target.value as WeeklyTodayKind })
              }
            >
              <option value="parking_from_task">Parking from task</option>
              <option value="after_loading">After loading → parking</option>
              <option value="drive_full_time">Drive full time → parking</option>
              <option value="after_ferry">After ferry → parking</option>
              <option value="near_company">Parking near company</option>
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend>Tonight pause</legend>
            <select
              className="select"
              value={form.tonightPause}
              onChange={(e) =>
                patchForm({
                  tonightPause: e.target.value as WeeklyTonightPause,
                })
              }
            >
              <option value="9">9h</option>
              <option value="11">11h</option>
              <option value="pull_chip">Pull out chip</option>
              <option value="none">None</option>
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend>Tomorrow start</legend>
            <input
              className="input input--plain"
              value={form.tomorrowStart}
              onChange={(e) => patchForm({ tomorrowStart: e.target.value })}
              placeholder="3:00"
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend>Tomorrow goal</legend>
            <select
              className="select"
              value={form.tomorrowGoal}
              onChange={(e) =>
                patchForm({
                  tomorrowGoal: e.target.value as WeeklyTomorrowGoal,
                })
              }
            >
              <option value="next_parking">Next parking from task</option>
              <option value="close_to_delivery">Close to delivery</option>
              <option value="custom">Custom text</option>
            </select>
          </fieldset>

          {form.tomorrowGoal === 'custom' && (
            <fieldset className="fieldset fieldset--wide">
              <legend>Tomorrow custom</legend>
              <input
                className="input input--plain"
                value={form.tomorrowCustom}
                onChange={(e) => patchForm({ tomorrowCustom: e.target.value })}
                placeholder="go to Vipiteno / service…"
              />
            </fieldset>
          )}

          <fieldset className="fieldset">
            <legend>Traffic ban</legend>
            <label className="radio">
              <input
                type="checkbox"
                checked={form.trafficBan}
                onChange={(e) => patchForm({ trafficBan: e.target.checked })}
              />
              Yes
            </label>
          </fieldset>

          {form.trafficBan && (
            <>
              <fieldset className="fieldset">
                <legend>Ban country</legend>
                <input
                  className="input input--plain"
                  value={form.trafficBanCountry}
                  onChange={(e) =>
                    patchForm({ trafficBanCountry: e.target.value })
                  }
                  placeholder="Italy"
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend>Ban from</legend>
                <input
                  className="input input--plain"
                  value={form.trafficBanFrom}
                  onChange={(e) =>
                    patchForm({ trafficBanFrom: e.target.value })
                  }
                  placeholder="8:00"
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend>Ban until</legend>
                <input
                  className="input input--plain"
                  value={form.trafficBanUntil}
                  onChange={(e) =>
                    patchForm({ trafficBanUntil: e.target.value })
                  }
                  placeholder="16:00"
                />
              </fieldset>
            </>
          )}

          <fieldset className="fieldset">
            <legend>Monday start</legend>
            <input
              className="input input--plain"
              value={form.mondayStart}
              onChange={(e) => patchForm({ mondayStart: e.target.value })}
              placeholder="6:00"
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend>Monday action</legend>
            <select
              className="select"
              value={form.mondayAction}
              onChange={(e) =>
                patchForm({
                  mondayAction: e.target.value as WeeklyMondayAction,
                })
              }
            >
              <option value="unloading">Unloading</option>
              <option value="loading">Loading</option>
              <option value="trailer_swap">Trailer swap</option>
              <option value="wait_order">Wait for order</option>
              <option value="custom">Custom</option>
            </select>
          </fieldset>

          {(form.mondayAction === 'unloading' ||
            form.mondayAction === 'loading') && (
            <fieldset className="fieldset">
              <legend>
                {form.mondayAction === 'loading' ? 'Loading at' : 'Unloading at'}
              </legend>
              <input
                className="input input--plain"
                value={form.mondayArriveBy}
                onChange={(e) => patchForm({ mondayArriveBy: e.target.value })}
                placeholder="8:00"
              />
            </fieldset>
          )}

          {form.mondayAction === 'trailer_swap' && (
            <fieldset className="fieldset">
              <legend>Swap time</legend>
              <input
                className="input input--plain"
                value={form.trailerSwapTime}
                onChange={(e) =>
                  patchForm({ trailerSwapTime: e.target.value })
                }
                placeholder="8:00"
              />
            </fieldset>
          )}

          {form.mondayAction === 'custom' && (
            <fieldset className="fieldset fieldset--wide">
              <legend>Monday custom</legend>
              <input
                className="input input--plain"
                value={form.mondayCustom}
                onChange={(e) => patchForm({ mondayCustom: e.target.value })}
                placeholder="drive to VERONA"
              />
            </fieldset>
          )}

          {form.pauseKind === 'long' && (
            <fieldset className="fieldset">
              <legend>Chip + envelopes</legend>
              <label className="radio">
                <input
                  type="checkbox"
                  checked={form.envelopes}
                  onChange={(e) => patchForm({ envelopes: e.target.checked })}
                />
                Insert chip + 2h envelopes
              </label>
            </fieldset>
          )}

          <fieldset className="fieldset">
            <legend>Extras</legend>
            <label className="radio">
              <input
                type="checkbox"
                checked={form.driverChange}
                onChange={(e) =>
                  patchForm({ driverChange: e.target.checked })
                }
              />
              Driver change / report
            </label>
            <label className="radio">
              <input
                type="checkbox"
                checked={form.everythingClear}
                onChange={(e) =>
                  patchForm({ everythingClear: e.target.checked })
                }
              />
              Everything clear?
            </label>
          </fieldset>

          <fieldset className="fieldset fieldset--wide">
            <legend>Extra notes</legend>
            <textarea
              className="input input--plain input--textarea"
              rows={3}
              value={form.extraNotes}
              onChange={(e) => patchForm({ extraNotes: e.target.value })}
              placeholder="Service booked 8:00 / leave France by 7:30…"
            />
          </fieldset>
        </div>

        <div className="ref-actions">
          <button type="button" className="btn btn--primary" onClick={generate}>
            Generate
          </button>
          {message && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void navigator.clipboard.writeText(message)}
            >
              Copy text
            </button>
          )}
        </div>

        {message && (
          <div className="message-box">
            <div className="message-box__bar">
              <span>Weekly message</span>
            </div>
            <pre>{message}</pre>
          </div>
        )}
      </div>

      <div className="truck-list-card">
        <div className="panel__toolbar panel__toolbar--tight">
          <h3 className="panel__subtitle">Copy per truck</h3>
          <div className="panel__toolbar-actions">
            <span className="badge">{sentCount} sent</span>
            <button
              type="button"
              className="btn btn--danger btn--tiny"
              disabled={sentCount === 0}
              onClick={clearAllSent}
            >
              Clear sent
            </button>
          </div>
        </div>
        {mainIds.length > 0 && (
          <>
            <p className="fleet-group-label">Fleet</p>
            <ul className="fleet-list">{renderFleet(mainIds)}</ul>
          </>
        )}
        {loctrackerIds.length > 0 && (
          <>
            <p className="fleet-group-label fleet-group-label--loctracker">
              Loctracker
            </p>
            <ul className="fleet-list">{renderFleet(loctrackerIds)}</ul>
          </>
        )}
      </div>
    </section>
  )
}
