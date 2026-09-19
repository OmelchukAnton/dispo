import { useEffect, useState } from 'react'
import { TrucksTab } from './components/TrucksTab'
import { InstructionsTab } from './components/InstructionsTab'
import { WeeklyInstructionsTab } from './components/WeeklyInstructionsTab'
import { EtaTab } from './components/EtaTab'
import { OrderAccountTab } from './components/OrderAccountTab'
import { AvgDistanceTab } from './components/AvgDistanceTab'
import { RefSearchTab } from './components/RefSearchTab'
import { TrafficBansTab } from './components/TrafficBansTab'
import type { TabId } from './types'
import './App.css'

const TABS: { id: TabId; short: string; label: string }[] = [
  { id: 'trucks', short: 'Trucks', label: 'Trucks' },
  { id: 'instructions', short: 'Generate', label: 'Generate instructions' },
  { id: 'weekly', short: 'Weekly', label: 'Weekly Instructions' },
  { id: 'eta', short: 'ETA', label: 'Long Trip ETA' },
  { id: 'orders', short: 'Orders', label: 'Order Account' },
  { id: 'distance', short: 'Distance', label: 'Avg Distance' },
  { id: 'refs', short: 'Refs', label: 'Ref Search' },
  { id: 'bans', short: 'Bans', label: 'Traffic bans' },
]

function cycleTab(current: TabId, delta: 1 | -1): TabId {
  const i = TABS.findIndex((t) => t.id === current)
  const next = (i + delta + TABS.length) % TABS.length
  return TABS[next]!.id
}

function App() {
  const [tab, setTab] = useState<TabId>('trucks')

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const n = e.code.match(/^Digit([1-8])$/)?.[1]
        if (n) {
          const target = TABS[Number(n) - 1]
          if (target) {
            e.preventDefault()
            setTab(target.id)
          }
        }
        return
      }

      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) return

      const next =
        e.key === 'Tab' && !e.shiftKey
          ? 1
          : e.key === 'Tab' && e.shiftKey
            ? -1
            : e.key === 'PageDown'
              ? 1
              : e.key === 'PageUp'
                ? -1
                : 0
      if (!next) return

      e.preventDefault()
      setTab((prev) => cycleTab(prev, next))
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">DP</span>
          <div>
            <p className="brand__name">Dispatch Planner</p>
            <p className="brand__tag">Fleet assistant</p>
          </div>
        </div>
        <nav className="tabs" aria-label="Main">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
              title={`${t.label} (Alt+${i + 1})`}
            >
              {t.short}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {tab === 'trucks' && <TrucksTab />}
        {tab === 'instructions' && <InstructionsTab />}
        {tab === 'weekly' && <WeeklyInstructionsTab />}
        {tab === 'eta' && <EtaTab />}
        {tab === 'orders' && <OrderAccountTab />}
        {tab === 'distance' && <AvgDistanceTab />}
        {tab === 'refs' && <RefSearchTab />}
        {tab === 'bans' && <TrafficBansTab />}
      </main>
    </div>
  )
}

export default App
