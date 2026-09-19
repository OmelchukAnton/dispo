import { useEffect, useId, useRef, useState } from 'react'
import {
  normalizeTruckId,
  parseTruckListText,
  type TruckGroup,
} from '../data/trucks'
import type { TruckId } from '../types'

interface Props {
  onClose: () => void
  onReplace: (group: TruckGroup, ids: TruckId[]) => void
  fleetIds: TruckId[]
  locIds: TruckId[]
}

export function ReplaceTrucksPopup({
  onClose,
  onReplace,
  fleetIds,
  locIds,
}: Props) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const addRef = useRef<HTMLInputElement>(null)
  const [group, setGroup] = useState<TruckGroup>('fleet')
  const [list, setList] = useState<TruckId[]>(() => [...fleetIds])
  const [addValue, setAddValue] = useState('')
  const [paste, setPaste] = useState('')

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function switchGroup(next: TruckGroup) {
    setGroup(next)
    setList(next === 'fleet' ? [...fleetIds] : [...locIds])
    setAddValue('')
    setPaste('')
  }

  function removeId(id: TruckId) {
    setList((prev) => prev.filter((t) => t !== id))
  }

  function addOne() {
    const id = normalizeTruckId(addValue)
    if (!id) return
    setList((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setAddValue('')
    addRef.current?.focus()
  }

  function addFromPaste() {
    const ids = parseTruckListText(paste)
    if (!ids.length) return
    setList((prev) => {
      const set = new Set(prev)
      for (const id of ids) set.add(id)
      return [...set]
    })
    setPaste('')
  }

  function handleReplace() {
    if (!list.length) {
      window.alert('List cannot be empty — add at least one truck')
      return
    }
    const groupLabel = group === 'fleet' ? 'Fleet' : 'Loctracker'
    const current = group === 'fleet' ? fleetIds.length : locIds.length
    if (
      !window.confirm(
        `Replace ${groupLabel} trucks (${current} → ${list.length})?\n\n${list.join(', ')}`,
      )
    ) {
      return
    }
    onReplace(group, list)
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal modal--truck modal--trucks-list"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal__header">
          <h2 id={titleId}>Trucks list</h2>
          <button
            ref={closeRef}
            type="button"
            className="icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="truck-form">
          <label className="truck-form__field">
            <span>Group</span>
            <div className="radio-row">
              <label className="radio">
                <input
                  type="radio"
                  name="replace-group"
                  checked={group === 'fleet'}
                  onChange={() => switchGroup('fleet')}
                />
                Fleet
                <span className="muted"> ({fleetIds.length})</span>
              </label>
              <label className="radio">
                <input
                  type="radio"
                  name="replace-group"
                  checked={group === 'loctracker'}
                  onChange={() => switchGroup('loctracker')}
                />
                Loc
                <span className="muted"> ({locIds.length})</span>
              </label>
            </div>
          </label>

          <div className="truck-form__field">
            <span>
              Current list <span className="muted">({list.length})</span>
            </span>
            {list.length === 0 ? (
              <p className="panel__hint" style={{ margin: 0 }}>
                No trucks — add plates below.
              </p>
            ) : (
              <ul className="replace-truck-list">
                {list.map((id) => (
                  <li key={id} className="replace-truck-chip">
                    <span className="truck-id">{id}</span>
                    <button
                      type="button"
                      className="btn btn--danger btn--tiny"
                      onClick={() => removeId(id)}
                      aria-label={`Remove ${id}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="truck-form__field">
            <span>Add truck</span>
            <div className="replace-truck-add">
              <input
                ref={addRef}
                className="input input--plain"
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addOne()
                  }
                }}
                placeholder="e.g. AFI363"
                spellCheck={false}
              />
              <button
                type="button"
                className="btn btn--primary btn--tiny"
                disabled={!normalizeTruckId(addValue)}
                onClick={addOne}
              >
                Add
              </button>
            </div>
          </div>

          <label className="truck-form__field">
            <span>Or paste several</span>
            <textarea
              className="input input--plain input--textarea"
              rows={3}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={'AFI363\nAIN471\nNJO636'}
              spellCheck={false}
            />
          </label>
          <button
            type="button"
            className="btn btn--ghost btn--tiny"
            disabled={!parseTruckListText(paste).length}
            onClick={addFromPaste}
          >
            Add pasted to list
          </button>
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <div className="modal__footer-actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!list.length}
              onClick={handleReplace}
            >
              Replace trucks
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
