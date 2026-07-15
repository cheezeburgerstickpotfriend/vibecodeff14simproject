import { useCallback, useState } from 'react'
import './App.css'
import { Arena } from './components/Arena'
import { EventLog } from './components/EventLog'
import { Hud } from './components/Hud'
import { sampleEncounter } from './encounters/sampleEncounter'
import { initGameState, stepSimulation } from './engine/simulation'
import { useGameLoop } from './hooks/useGameLoop'
import { useKeyboardMovement } from './hooks/useKeyboardMovement'

function App() {
  const [state, setState] = useState(() => initGameState(sampleEncounter))
  const moveDirRef = useKeyboardMovement()

  const running = state.status === 'running'

  useGameLoop(
    useCallback(
      (dtMs: number) => {
        setState((prev) => stepSimulation(prev, dtMs, moveDirRef.current, sampleEncounter))
      },
      [moveDirRef],
    ),
    running,
  )

  const start = () => setState((prev) => ({ ...prev, status: 'running' }))
  const reset = () => setState(initGameState(sampleEncounter))

  return (
    <div className="app">
      <header className="app-header">
        <h1>{sampleEncounter.name}</h1>
        <p className="subtitle">Read the telegraph. Get in the right spot. Survive.</p>
      </header>

      <div className="layout">
        <div className="arena-column">
          <Arena
            arena={sampleEncounter.arena}
            bossPos={state.bossPos}
            playerPos={state.player.pos}
            active={state.active}
            timeMs={state.timeMs}
          />
          <Hud hp={state.player.hp} maxHp={state.player.maxHp} timeMs={state.timeMs} active={state.active} />

          <div className="controls">
            {state.status === 'idle' && (
              <button type="button" onClick={start}>
                Start Encounter
              </button>
            )}
            {(state.status === 'cleared' || state.status === 'failed') && (
              <button type="button" onClick={reset}>
                Try Again
              </button>
            )}
            {running && <span className="hint">Move with WASD or Arrow Keys</span>}
          </div>

          {state.status === 'cleared' && <div className="banner banner-clear">Encounter Clear!</div>}
          {state.status === 'failed' && <div className="banner banner-fail">You died. Run it back.</div>}
        </div>

        <EventLog log={state.log} />
      </div>
    </div>
  )
}

export default App
