import { useCallback, useMemo, useState } from 'react'
import './App.css'
import { Arena } from './components/Arena'
import { BossPicker } from './components/BossPicker'
import { EventLog } from './components/EventLog'
import { Hud } from './components/Hud'
import { MechanicSelector } from './components/MechanicSelector'
import { allBosses } from './encounters/bosses'
import { buildEncounter } from './engine/encounterBuilder'
import { initGameState, stepSimulation, type Encounter } from './engine/simulation'
import { useGameLoop } from './hooks/useGameLoop'
import { useKeyboardMovement } from './hooks/useKeyboardMovement'

function App() {
  const [bossId, setBossId] = useState(allBosses[0].id)
  const boss = useMemo(() => allBosses.find((b) => b.id === bossId) ?? allBosses[0], [bossId])

  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(boss.mechanics.map((m) => [m.id, true])),
  )
  const [randomize, setRandomize] = useState(false)
  const [overlap, setOverlap] = useState(false)
  const [encounter, setEncounter] = useState<Encounter>(() =>
    buildEncounter(boss, boss.mechanics, { randomize: false, overlap: false }),
  )
  const [state, setState] = useState(() => initGameState(encounter))
  const moveDirRef = useKeyboardMovement()

  const running = state.status === 'running'
  const selectedCount = useMemo(() => boss.mechanics.filter((m) => enabled[m.id]).length, [boss, enabled])

  useGameLoop(
    useCallback(
      (dtMs: number) => {
        setState((prev) => stepSimulation(prev, dtMs, moveDirRef.current, encounter))
      },
      [moveDirRef, encounter],
    ),
    running,
  )

  const selectBoss = (id: string) => {
    const nextBoss = allBosses.find((b) => b.id === id)
    if (!nextBoss) return
    setBossId(id)
    setEnabled(Object.fromEntries(nextBoss.mechanics.map((m) => [m.id, true])))
    const newEncounter = buildEncounter(nextBoss, nextBoss.mechanics, { randomize, overlap })
    setEncounter(newEncounter)
    setState(initGameState(newEncounter))
  }

  const toggleMechanic = (id: string) => setEnabled((prev) => ({ ...prev, [id]: !prev[id] }))

  const start = () => {
    const selected = boss.mechanics.filter((m) => enabled[m.id])
    if (selected.length === 0) return
    const newEncounter = buildEncounter(boss, selected, { randomize, overlap })
    setEncounter(newEncounter)
    setState({ ...initGameState(newEncounter), status: 'running' })
  }

  const reset = () => setState(initGameState(encounter))

  return (
    <div className="app">
      <header className="app-header">
        <h1>{boss.meta.name}</h1>
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
            <>
              <BossPicker bosses={allBosses} selectedId={bossId} onSelect={selectBoss} />
              <MechanicSelector
                mechanics={boss.mechanics}
                enabled={enabled}
                onToggle={toggleMechanic}
                randomize={randomize}
                onRandomizeChange={setRandomize}
                overlap={overlap}
                onOverlapChange={setOverlap}
              />
            </>
          )}
        </div>

        <EventLog log={state.log} />
      </div>
    </div>
  )
}

export default App
