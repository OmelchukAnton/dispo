import { useMemo, useState } from 'react'
import { addDays, addMinutes } from 'date-fns'
import { TRUCK_IDS } from '../data/trucks'
import type {
  InstructionTruckState,
  OpType,
  RestHours,
  TruckId,
  WeekendRest,
} from '../types'
import { wallClockMinutesForDriving } from '../utils/breaks'
import { parseTimeInput } from '../utils/format'

function loadInstructionState(): Record<TruckId, InstructionTruckState> {
  const raw = localStorage.getItem('dispatch-instructions-v1')
  if (raw) {
    try {
      return JSON.parse(raw) as Record<TruckId, InstructionTruckState>
    } catch {
      /* fallthrough */
    }
  }
  const init = {} as Record<TruckId, InstructionTruckState>
  for (const id of TRUCK_IDS) {
    init[id] = { sent: false, weekendRest: null }
  }
  return init
}

/** Round to nearest whole or half hour (:00 / :30). */
function roundToHalfHour(date: Date): Date {
  const d = new Date(date)
  const totalMins = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
  const rounded = Math.round(totalMins / 30) * 30
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  out.setMinutes(rounded)
  return out
}

function formatClock(date: Date): string {
  const h = date.getHours()
  const m = date.getMinutes()
  return `${h}:${String(m).padStart(2, '0')}`
}

function buildMessage(
  parkingArrive: Date,
  rest: RestHours,
  morningStart: Date,
  op: OpType,
  targetArrive: Date | null,
): string {
  const arriveRounded = roundToHalfHour(parkingArrive)
  const startRounded = roundToHalfHour(morningStart)
  const opWord = op === 'unloading' ? 'unloading' : 'loading'
  const targetText = targetArrive
    ? formatClock(roundToHalfHour(targetArrive))
    : ''

  return [
    'Going to the parking from the task.',
    `You will arrive around ${formatClock(arriveRounded)}.`,
    `Make a ${rest}h pause.`,
    `Start tomorrow at ${formatClock(startRounded)}.`,
    targetText
      ? `Go to the ${opWord} at ${targetText}.`
      : `Go to the ${opWord}.`,
    'Everything clear? Please confirm.',
  ].join('\n')
}

export function InstructionsTab() {
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [driveLeft, setDriveLeft] = useState('3')
  const [distanceKm, setDistanceKm] = useState('400')
  const [avgSpeed, setAvgSpeed] = useState('67')
  const [restHours, setRestHours] = useState<RestHours>(9)
  const [opType, setOpType] = useState<OpType>('unloading')
  const [arriveBy, setArriveBy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [truckState, setTruckState] = useState(loadInstructionState)

  function persist(next: Record<TruckId, InstructionTruckState>) {
    setTruckState(next)
    localStorage.setItem('dispatch-instructions-v1', JSON.stringify(next))
  }

  function calculate() {
    const clockNow = new Date()
    const currentTimeValue = `${String(clockNow.getHours()).padStart(2, '0')}:${String(clockNow.getMinutes()).padStart(2, '0')}`
    setCurrentTime(currentTimeValue)

    const now = parseTimeInput(currentTimeValue, clockNow)
    if (!now) {
      setError('Current time: HH:mm or dd/MM/yyyy HH:mm')
      setMessage('')
      return
    }

    const driveHours = Number(driveLeft.replace(',', '.'))
    if (!Number.isFinite(driveHours) || driveHours < 0) {
      setError('Drive left today: enter hours (e.g. 2.5)')
      setMessage('')
      return
    }

    const km = Number(distanceKm.replace(',', '.'))
    const speed = Number(avgSpeed.replace(',', '.'))
    if (!Number.isFinite(km) || km <= 0) {
      setError('Distance: enter km (e.g. 400)')
      setMessage('')
      return
    }
    if (!Number.isFinite(speed) || speed <= 0) {
      setError('Avg speed: enter km/h (e.g. 67)')
      setMessage('')
      return
    }

    const nextDay = addDays(now, 1)
    let target: Date | null = null
    if (arriveBy.trim()) {
      const trimmed = arriveBy.trim()
      const isTimeOnly = /^\d{1,2}:\d{2}$/.test(trimmed)
      target = parseTimeInput(trimmed, isTimeOnly ? nextDay : now)
      if (!target) {
        setError('Arrive by (next day): HH:mm')
        setMessage('')
        return
      }
    }

    const tripDriveHours = km / speed
    const todayDriveHours = Math.min(driveHours, tripDriveHours)
    const parkingArrive = addMinutes(
      now,
      wallClockMinutesForDriving(todayDriveHours),
    )
    const morningStart = addMinutes(parkingArrive, restHours * 60)

    setError('')
    setMessage(
      buildMessage(parkingArrive, restHours, morningStart, opType, target),
    )
  }

  function toggleSent(id: TruckId) {
    const next = {
      ...truckState,
      [id]: { ...truckState[id], sent: !truckState[id].sent },
    }
    persist(next)
  }

  function setWeekend(id: TruckId, value: WeekendRest) {
    const next = {
      ...truckState,
      [id]: { ...truckState[id], weekendRest: value },
    }
    persist(next)
  }

  const sentCount = useMemo(
    () => TRUCK_IDS.filter((id) => truckState[id]?.sent).length,
    [truckState],
  )

  return (
    <section className="panel panel--instructions">
      <div className="calc-card">
        <h2 className="panel__title">Generate instructions</h2>
        <p className="panel__hint">
          Includes 45 min break every 4.5h driving. Arrive by = next day time.
        </p>

        <div className="instructions-form">
          <fieldset className="fieldset">
            <legend>Current time</legend>
            <input
              className="input input--plain"
              value={currentTime}
              onChange={(e) => setCurrentTime(e.target.value)}
              placeholder="15:00"
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend>Drive left today (h)</legend>
            <input
              className="input input--plain"
              type="number"
              min={0}
              step={0.5}
              value={driveLeft}
              onChange={(e) => setDriveLeft(e.target.value)}
              placeholder="3"
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend>Distance (km)</legend>
            <input
              className="input input--plain"
              type="number"
              min={1}
              step={1}
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="400"
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend>Avg speed (km/h)</legend>
            <input
              className="input input--plain"
              type="number"
              min={1}
              step={1}
              value={avgSpeed}
              onChange={(e) => setAvgSpeed(e.target.value)}
              placeholder="67"
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend>Night rest</legend>
            <label className="radio">
              <input
                type="radio"
                name="rest"
                checked={restHours === 9}
                onChange={() => setRestHours(9)}
              />
              9h
            </label>
            <label className="radio">
              <input
                type="radio"
                name="rest"
                checked={restHours === 11}
                onChange={() => setRestHours(11)}
              />
              11h
            </label>
          </fieldset>

          <fieldset className="fieldset">
            <legend>Operation</legend>
            <label className="radio">
              <input
                type="radio"
                name="op"
                checked={opType === 'unloading'}
                onChange={() => setOpType('unloading')}
              />
              Unloading
            </label>
            <label className="radio">
              <input
                type="radio"
                name="op"
                checked={opType === 'loading'}
                onChange={() => setOpType('loading')}
              />
              Loading
            </label>
          </fieldset>

          <fieldset className="fieldset">
            <legend>Arrive by (next day)</legend>
            <input
              className="input input--plain"
              value={arriveBy}
              onChange={(e) => setArriveBy(e.target.value)}
              placeholder="08:00"
            />
          </fieldset>
        </div>

        <button type="button" className="btn btn--primary" onClick={calculate}>
          Calculate
        </button>

        {error && <p className="error">{error}</p>}

        {message && (
          <div className="message-box">
            <div className="message-box__bar">
              <span>Driver message</span>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => navigator.clipboard.writeText(message)}
              >
                Copy
              </button>
            </div>
            <pre>{message}</pre>
          </div>
        )}
      </div>

      <div className="truck-list-card">
        <div className="panel__toolbar panel__toolbar--tight">
          <h3 className="panel__subtitle">Fleet</h3>
          <span className="badge">{sentCount} sent</span>
        </div>
        <ul className="fleet-list">
          {TRUCK_IDS.map((id) => {
            const state = truckState[id] ?? { sent: false, weekendRest: null }
            return (
              <li key={id} className="fleet-chip">
                <button
                  type="button"
                  className={`fleet-truck ${state.sent ? 'is-sent' : ''}`}
                  onClick={() => toggleSent(id)}
                  title="Click to mark instruction sent"
                >
                  {id}
                </button>
                <select
                  className="select select--weekend"
                  aria-label={`Weekend rest for ${id}`}
                  title="Weekend Rest"
                  value={state.weekendRest ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setWeekend(id, v === '' ? null : (Number(v) as 24 | 47))
                  }}
                >
                  <option value="">—</option>
                  <option value="24">24h</option>
                  <option value="47">47h</option>
                </select>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
