import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { formatDateTime, parseTimeInput } from '../utils/format'
import {
  calculateLongTripEta,
  estimateOvernightCount,
  NIGHT_REST_OPTIONS,
  type EtaResult,
  type NightRestHours,
} from '../utils/eta'

function nightLabel(index: number): string {
  if (index === 0) return 'Tonight (after Day 1)'
  if (index === 1) return 'Tomorrow night (after Day 2)'
  return `Night after Day ${index + 1}`
}

export function EtaTab() {
  const [startTime, setStartTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [driveLeft, setDriveLeft] = useState('4')
  const [distanceKm, setDistanceKm] = useState('1100')
  const [avgSpeed, setAvgSpeed] = useState('67')
  const [maxDrive, setMaxDrive] = useState('9')
  const [nightRests, setNightRests] = useState<NightRestHours[]>([9, 11])
  const [error, setError] = useState('')
  const [result, setResult] = useState<EtaResult | null>(null)

  const overnightCount = useMemo(() => {
    const distance = Number(distanceKm)
    const speed = Number(avgSpeed)
    const driveToday = Number(driveLeft)
    const drive = Number(maxDrive)
    if (
      ![distance, speed, drive].every((n) => Number.isFinite(n) && n > 0) ||
      !Number.isFinite(driveToday) ||
      driveToday < 0
    ) {
      return 0
    }
    return estimateOvernightCount({
      distanceKm: distance,
      avgSpeedKmh: speed,
      driveLeftToday: driveToday,
      maxDriveHoursPerDay: drive,
    })
  }, [distanceKm, avgSpeed, driveLeft, maxDrive])

  const visibleNights = useMemo(() => {
    const count = Math.max(overnightCount, 1)
    const next = [...nightRests]
    while (next.length < count) {
      next.push(next.length === 0 ? 9 : 11)
    }
    return next.slice(0, count)
  }, [overnightCount, nightRests])

  function setNightRest(index: number, value: NightRestHours) {
    setNightRests((prev) => {
      const count = Math.max(overnightCount, 1)
      const next = [...prev]
      while (next.length < count) {
        next.push(next.length === 0 ? 9 : 11)
      }
      next[index] = value
      return next.slice(0, count)
    })
  }

  function onCalcClick() {
    const start = parseTimeInput(startTime)
    if (!start) {
      setError('Enter start time as HH:mm or dd/MM/yyyy HH:mm')
      setResult(null)
      return
    }

    const distance = Number(distanceKm)
    const speed = Number(avgSpeed)
    const driveToday = Number(driveLeft)
    const drive = Number(maxDrive)

    if (
      ![distance, speed, drive].every((n) => Number.isFinite(n) && n > 0)
    ) {
      setError('Check distance, speed and max drive')
      setResult(null)
      return
    }
    if (!Number.isFinite(driveToday) || driveToday < 0) {
      setError('Drive left today: enter hours (e.g. 4)')
      setResult(null)
      return
    }

    const nightsNeeded = estimateOvernightCount({
      distanceKm: distance,
      avgSpeedKmh: speed,
      driveLeftToday: driveToday,
      maxDriveHoursPerDay: drive,
    })

    const restHoursByNight = Array.from({ length: Math.max(nightsNeeded, 1) }, (_, i) => {
      return nightRests[i] ?? (i === 0 ? 9 : 11)
    })

    setError('')
    setResult(
      calculateLongTripEta({
        start,
        distanceKm: distance,
        avgSpeedKmh: speed,
        driveLeftToday: driveToday,
        maxDriveHoursPerDay: drive,
        restHoursByNight,
      }),
    )
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Long Trip ETA</h2>
      <p className="panel__hint">
        Day 1 uses Drive left today. Pick overnight rest for each night (9 / 11
        / 24 / 47h) depending on trip length. Includes 45 min break every 4.5h
        driving. Press Calculate to update.
      </p>

      <div className="form-grid">
        <label className="field">
          <span>Loaded / start time</span>
          <input
            className="input"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="15:00"
          />
        </label>
        <label className="field">
          <span>Drive left today (h)</span>
          <input
            className="input"
            type="number"
            min={0}
            step={0.5}
            value={driveLeft}
            onChange={(e) => setDriveLeft(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Distance (km)</span>
          <input
            className="input"
            type="number"
            min={1}
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Average speed (km/h)</span>
          <input
            className="input"
            type="number"
            min={1}
            value={avgSpeed}
            onChange={(e) => setAvgSpeed(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Max drive hours / day</span>
          <input
            className="input"
            type="number"
            min={1}
            max={10}
            value={maxDrive}
            onChange={(e) => setMaxDrive(e.target.value)}
          />
        </label>
      </div>

      {overnightCount === 0 ? (
        <p className="panel__hint">No overnight rest needed for this distance.</p>
      ) : (
        <div className="night-rest-grid">
          {visibleNights.map((value, index) => (
            <fieldset key={index} className="fieldset">
              <legend>{nightLabel(index)}</legend>
              {NIGHT_REST_OPTIONS.map((opt) => (
                <label key={opt} className="radio">
                  <input
                    type="radio"
                    name={`night-rest-${index}`}
                    checked={value === opt}
                    onChange={() => setNightRest(index, opt)}
                  />
                  {opt}h
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      )}

      <button type="button" className="btn btn--primary" onClick={onCalcClick}>
        Calculate ETA
      </button>
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="eta-result">
          <div className="eta-summary">
            <div>
              <span className="muted">Total driving</span>
              <strong>{result.totalDriveHours} h</strong>
            </div>
            <div>
              <span className="muted">Breaks (45 min / 4.5h)</span>
              <strong>{result.totalBreakMinutes} min</strong>
            </div>
            <div>
              <span className="muted">ETA</span>
              <strong>{formatDateTime(result.eta)}</strong>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Date</th>
                  <th>Drive</th>
                  <th>Breaks</th>
                  <th>Wall clock</th>
                  <th>Distance</th>
                  <th>Park / arrive</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {result.days.map((d) => (
                  <tr key={d.dayLabel}>
                    <td>{d.dayLabel}</td>
                    <td>{format(d.dayDate, 'dd/MM/yyyy')}</td>
                    <td>{d.driveHours} h</td>
                    <td>{d.breakMinutes} min</td>
                    <td>{d.wallClockHours} h</td>
                    <td>{d.distanceKm} km</td>
                    <td>{formatDateTime(d.arriveOrParkAt)}</td>
                    <td>{d.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
