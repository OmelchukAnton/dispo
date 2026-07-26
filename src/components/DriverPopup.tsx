import { useEffect, useId, useRef } from 'react'
import type { DriverCard } from '../types'

interface Props {
  truckId: string
  card: DriverCard
  onClose: () => void
}

export function DriverPopup({ truckId, card, onClose }: Props) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id={titleId}>Driver card · {truckId}</h2>
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
        <dl className="driver-card">
          <div>
            <dt>Driver name</dt>
            <dd>{card.driverName}</dd>
          </div>
          <div>
            <dt>Birth date</dt>
            <dd>{card.birthDate}</dd>
          </div>
          <div>
            <dt>Employee ID</dt>
            <dd>{card.employeeId}</dd>
          </div>
          <div>
            <dt>Truck / company</dt>
            <dd>{card.truckCompany}</dd>
          </div>
          <div>
            <dt>Trailer</dt>
            <dd>{card.trailer}</dd>
          </div>
          <div>
            <dt>Mechanic</dt>
            <dd>{card.mechanic}</dd>
          </div>
          <div>
            <dt>Missing</dt>
            <dd>{card.missing}</dd>
          </div>
          <div>
            <dt>CMR date</dt>
            <dd>{card.cmrDate}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
