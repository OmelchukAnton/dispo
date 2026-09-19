import { useEffect, useId, useRef, useState } from 'react'
import type { TruckGroup } from '../data/trucks'
import type { DriverCard, TruckId } from '../types'

const FIELDS: { key: keyof DriverCard; label: string }[] = [
  { key: 'driverName', label: 'Driver name' },
  { key: 'birthDate', label: 'Birth date' },
  { key: 'employeeId', label: 'Employee ID' },
  { key: 'truckCompany', label: 'Truck / company' },
  { key: 'trailer', label: 'Trailer' },
  { key: 'mechanic', label: 'Mechanic' },
]

interface BaseProps {
  onClose: () => void
}

interface AddProps extends BaseProps {
  mode: 'add'
  existingIds: TruckId[]
  onSave: (id: TruckId, group: TruckGroup, card: DriverCard) => void
}

interface EditProps extends BaseProps {
  mode: 'edit'
  truckId: TruckId
  card: DriverCard
  group: TruckGroup
  onSave: (card: DriverCard, group: TruckGroup) => void
  onDelete: () => void
}

type Props = AddProps | EditProps

function emptyForm(truckId = ''): DriverCard {
  return {
    driverName: '',
    birthDate: '',
    employeeId: '',
    truckCompany: truckId,
    trailer: '',
    mechanic: '',
    missing: '',
    cmrDate: '',
  }
}

export function DriverPopup(props: Props) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const isAdd = props.mode === 'add'

  const [truckId, setTruckId] = useState(
    isAdd ? '' : props.truckId,
  )
  const [group, setGroup] = useState<TruckGroup>(
    isAdd ? 'fleet' : props.group,
  )
  const [card, setCard] = useState<DriverCard>(
    isAdd ? emptyForm() : { ...props.card },
  )

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [props])

  function patchField(key: keyof DriverCard, value: string) {
    setCard((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    const id = truckId.trim().toUpperCase().replace(/\s+/g, '')
    if (!id) {
      window.alert('Enter a truck plate / ID')
      return
    }
    if (isAdd && props.existingIds.includes(id)) {
      window.alert(`Truck ${id} is already in the list`)
      return
    }
    const nextCard: DriverCard = {
      ...card,
      truckCompany: card.truckCompany.trim() || id,
    }
    if (isAdd) {
      if (!window.confirm(`Add ${id} to ${group === 'loctracker' ? 'Loctracker' : 'Fleet'}?`)) {
        return
      }
      props.onSave(id, group, nextCard)
    } else {
      props.onSave(nextCard, group)
    }
  }

  function handleDelete() {
    if (props.mode !== 'edit') return
    if (!window.confirm(`Delete truck ${props.truckId} from the table?`)) return
    props.onDelete()
  }

  return (
    <div className="modal-backdrop" onClick={props.onClose} role="presentation">
      <div
        className="modal modal--truck"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id={titleId}>
            {isAdd ? 'Add truck' : `Truck · ${props.truckId}`}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="icon-btn"
            onClick={props.onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="truck-form">
          <label className="truck-form__field">
            <span>Truck ID</span>
            <input
              className="input"
              value={truckId}
              disabled={!isAdd}
              onChange={(e) => {
                const v = e.target.value.toUpperCase()
                setTruckId(v)
                setCard((prev) => ({
                  ...prev,
                  truckCompany: prev.truckCompany === truckId || !prev.truckCompany
                    ? v
                    : prev.truckCompany,
                }))
              }}
              placeholder="e.g. AIF999"
            />
          </label>

          <label className="truck-form__field">
            <span>Group</span>
            <select
              className="select"
              value={group}
              onChange={(e) => setGroup(e.target.value as TruckGroup)}
            >
              <option value="fleet">Fleet</option>
              <option value="loctracker">Loctracker</option>
            </select>
          </label>

          {FIELDS.map(({ key, label }) => (
            <label key={key} className="truck-form__field">
              <span>{label}</span>
              <input
                className="input"
                value={card[key]}
                onChange={(e) => patchField(key, e.target.value)}
                placeholder={label}
              />
            </label>
          ))}
        </div>

        <footer className="modal__footer">
          {props.mode === 'edit' && (
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
            >
              Delete truck
            </button>
          )}
          <div className="modal__footer-actions">
            <button type="button" className="btn" onClick={props.onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSave}
            >
              {isAdd ? 'Add truck' : 'Save'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
