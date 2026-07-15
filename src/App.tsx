import { useCallback, useMemo, useState } from 'react'
import './App.css'
import { Arena } from './components/Arena'
import { EventLog } from './components/EventLog'
import { Hud } from './components/Hud'
import { MechanicSelector } from './components/MechanicSelector'
import { allMechanics, buildEncounter, encounterMeta } from './encounters/sampleEncounter'
import { initGameState, stepSimulation, type Encounter } from './engine/simulation'
import { useGameLoop } from './hooks/useGameLoop'
import { useKeyboardMovement } from './hooks/useKeyboardMovement'

function App() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allMechanics.map((m) => [m.id, true])),
  )
  const [randomize, setRandomize] = useState(false)
  const [encounter, setEncounter] = useState<Encounter>(() => buildEncounter(allMechanics, false))
  const [state, setState] = useState(() => initGameState(encounter))
  const moveDirRef = useKeyboardMovement()

  const running = state.status === 'running'
  const selectedCount = useMemo(() => allMechanics.filter((m) => enabled[m.id]).length, [enabled])

  useGameLoop(
    useCallback(
      (dtMs: number) => {
        setState((prev) => stepSimulation(prev, dtMs, moveDirRef.current, encounter))
      },
      [moveDirRef, encounter],
    ),
    running,
  )

  const toggleMechanic = (id: string) => setEnabled((prev) => ({ ...prev, [id]: !prev[id] }))

  const start = () => {
    const selected = allMechanics.filter((m) => enabled[m.id])
    if (selected.length === 0) return
    const newEncounter = buildEncounter(selected, randomize)
    setEncounter(newEncounter)
    setState({ ...initGameState(newEncounter), status: 'running' })
  }

  const reset = () => setState(initGameState(encounter))

  return (
    <div className="app">
      <header className="app-header">
        <h1>{encounterMeta.name}</h1>
        <p className="subtitle">Read the telegraph. Get in the right spot. Survive.</p>
      </header>

      <div className="layout">
        <div className="arena-column">
          <Arena
            arena={encounter.arena}
            bossPos={state.bossPos}
            playerPos={state.player.pos}
            active={state.active}
            timeMs={state.timeMs}
          />
          <Hud hp={state.player.hp} maxHp={state.player.maxHp} timeMs={state.timeMs} active={state.active} />

          <div className="controls">
            {state.status === 'idle' && (
              <button type="button" onClick={start} disabled={selectedCount === 0}>
                Start Encounter
              </button>
            )}
            {(state.status === 'cleared' || state.status === 'failed') && (
              <button type="button" onClick={reset}>
                Configure &amp; Try Again
              </button>
            )}
            {running && <span className="hint">Move with WASD or Arrow Keys</span>}
          </div>

          {state.status === 'idle' && selectedCount === 0 && (
            <p className="hint">Select at least one mechanic to start.</p>
          )}

          {state.status === 'cleared' && <div className="banner banner-clear">Encounter Clear!</div>}
          {state.status === 'failed' && <div className="banner banner-fail">You died. Run it back.</div>}

          {state.status === 'idle' && (
            <MechanicSelector
              mechanics={allMechanics}
              enabled={enabled}
              onToggle={toggleMechanic}
              randomize={randomize}
              onRandomizeChange={setRandomize}
            />
          )}
        </div>

        <EventLog log={state.log} />
      </div>
    </div>
  )
}

export default App
