import { useCallback, useMemo, useState } from 'react'
import './App.css'
import { Arena } from './components/Arena'
import { BossPicker } from './components/BossPicker'
import { EventLog } from './components/EventLog'
import { Hud } from './components/Hud'
import { MechanicSelector } from './components/MechanicSelector'
import { RoleSelector } from './components/RoleSelector'
import { allBosses } from './encounters/bosses'
import type { BossDefinition } from './engine/boss'
import { buildEncounter } from './engine/encounterBuilder'
import type { MechanicTemplate } from './engine/mechanics'
import type { Role } from './engine/role'
import { initGameState, stepSimulation, type Encounter } from './engine/simulation'
import { useGameLoop } from './hooks/useGameLoop'
import { useKeyboardMovement } from './hooks/useKeyboardMovement'

/** A boss's mechanics for the given role, in authored order, repeats intact (e.g. a loop mechanic cast several times). */
function mechanicsForRole(boss: BossDefinition, role: Role): MechanicTemplate[] {
  return boss.mechanics.filter((m) => !m.roles || m.roles.includes(role))
}

/** Same list with repeats collapsed, for rendering one checkbox per distinct mechanic. */
function dedupeById(mechanics: MechanicTemplate[]): MechanicTemplate[] {
  const seen = new Set<string>()
  return mechanics.filter((m) => (seen.has(m.id) ? false : seen.add(m.id)))
}

function App() {
  const [bossId, setBossId] = useState(allBosses[0].id)
  const [role, setRole] = useState<Role>('dps')
  const boss = useMemo(() => allBosses.find((b) => b.id === bossId) ?? allBosses[0], [bossId])

  const availableMechanics = useMemo(() => mechanicsForRole(boss, role), [boss, role])
  const uniqueMechanics = useMemo(() => dedupeById(availableMechanics), [availableMechanics])

  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(availableMechanics.map((m) => [m.id, true])),
  )
  const [randomize, setRandomize] = useState(false)
  const [overlap, setOverlap] = useState(false)
  const [encounter, setEncounter] = useState<Encounter>(() =>
    buildEncounter(boss, availableMechanics, { randomize: false, overlap: false }),
  )
  const [state, setState] = useState(() => initGameState(encounter))
  const moveDirRef = useKeyboardMovement()

  const running = state.status === 'running'
  const selectedCount = useMemo(
    () => uniqueMechanics.filter((m) => enabled[m.id]).length,
    [uniqueMechanics, enabled],
  )

  useGameLoop(
    useCallback(
      (dtMs: number) => {
        setState((prev) => stepSimulation(prev, dtMs, moveDirRef.current, encounter))
      },
      [moveDirRef, encounter],
    ),
    running,
  )

  const resetFor = (nextBoss: BossDefinition, nextRole: Role) => {
    const nextAvailable = mechanicsForRole(nextBoss, nextRole)
    setEnabled(Object.fromEntries(nextAvailable.map((m) => [m.id, true])))
    const newEncounter = buildEncounter(nextBoss, nextAvailable, { randomize, overlap })
    setEncounter(newEncounter)
    setState(initGameState(newEncounter))
  }

  const selectBoss = (id: string) => {
    const nextBoss = allBosses.find((b) => b.id === id)
    if (!nextBoss) return
    setBossId(id)
    resetFor(nextBoss, role)
  }

  const selectRole = (nextRole: Role) => {
    setRole(nextRole)
    resetFor(boss, nextRole)
  }

  const toggleMechanic = (id: string) => setEnabled((prev) => ({ ...prev, [id]: !prev[id] }))

  const start = () => {
    const selected = availableMechanics.filter((m) => enabled[m.id])
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
              <RoleSelector selected={role} onSelect={selectRole} />
              <MechanicSelector
                mechanics={uniqueMechanics}
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
