import { useState } from 'react'
import { TrucksTab } from './components/TrucksTab'
import { InstructionsTab } from './components/InstructionsTab'
import { EtaTab } from './components/EtaTab'
import { OrderAccountTab } from './components/OrderAccountTab'
import { RefSearchTab } from './components/RefSearchTab'
import type { TabId } from './types'
import './App.css'

const TABS: { id: TabId; label: string }[] = [
  { id: 'trucks', label: 'Trucks' },
  { id: 'instructions', label: 'Generate instructions' },
  { id: 'eta', label: 'Long Trip ETA' },
  { id: 'orders', label: 'Order Account' },
  { id: 'refs', label: 'Ref Search' },
]

function App() {
  const [tab, setTab] = useState<TabId>('trucks')

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
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {tab === 'trucks' && <TrucksTab />}
        {tab === 'instructions' && <InstructionsTab />}
        {tab === 'eta' && <EtaTab />}
        {tab === 'orders' && <OrderAccountTab />}
        {tab === 'refs' && <RefSearchTab />}
      </main>
    </div>
  )
}

export default App
