import type { CastEvent, ActiveMechanic } from './mechanics'
import { isInsideShape } from './mechanics'
import type { Vector2 } from './vector'
import { add, clampToCircle, scale } from './vector'

export interface ArenaConfig {
  center: Vector2
  radius: number
}

export interface Encounter {
  name: string
  arena: ArenaConfig
  bossPos: Vector2
  playerStart: Vector2
  playerMaxHp: number
  /** Movement speed in arena units per second. */
  playerSpeed: number
  timeline: CastEvent[]
}

export type EncounterStatus = 'idle' | 'running' | 'cleared' | 'failed'

export interface LogEntry {
  id: string
  timeMs: number
  message: string
  kind: 'info' | 'damage' | 'safe' | 'clear' | 'fail'
}

export interface PlayerState {
  pos: Vector2
  hp: number
  maxHp: number
}

export interface GameState {
  timeMs: number
  status: EncounterStatus
  player: PlayerState
  bossPos: Vector2
  active: ActiveMechanic[]
  nextCastIndex: number
  log: LogEntry[]
}

let logCounter = 0
const nextLogId = () => `log-${++logCounter}`

export function initGameState(encounter: Encounter): GameState {
  return {
    timeMs: 0,
    status: 'idle',
    player: { pos: { ...encounter.playerStart }, hp: encounter.playerMaxHp, maxHp: encounter.playerMaxHp },
    bossPos: { ...encounter.bossPos },
    active: [],
    nextCastIndex: 0,
    log: [{ id: nextLogId(), timeMs: 0, message: 'Encounter ready. Press Start.', kind: 'info' }],
  }
}

/**
 * Advances the simulation by `dtMs`, moving the player by `moveDir` (a unit-ish
 * vector) and resolving any mechanics whose telegraph timer has elapsed.
 * Pure function: returns a new GameState, does not mutate the input.
 */
export function stepSimulation(
  state: GameState,
  dtMs: number,
  moveDir: Vector2,
  encounter: Encounter,
): GameState {
  if (state.status !== 'running') return state

  const timeMs = state.timeMs + dtMs
  const dtSec = dtMs / 1000
  const movedPos = add(state.player.pos, scale(moveDir, encounter.playerSpeed * dtSec))
  const pos = clampToCircle(movedPos, encounter.arena.center, encounter.arena.radius)

  const log: LogEntry[] = [...state.log]
  let active = [...state.active]
  let nextCastIndex = state.nextCastIndex
  let hp = state.player.hp

  // Spawn any telegraphs whose start time has arrived.
  while (nextCastIndex < encounter.timeline.length && encounter.timeline[nextCastIndex].startMs <= timeMs) {
    const cast = encounter.timeline[nextCastIndex]
    const shape = cast.template.makeShape
      ? cast.template.makeShape({ bossPos: state.bossPos, playerPos: pos })
      : null
    active.push({
      instanceId: `${cast.template.id}-${cast.startMs}`,
      template: cast.template,
      shape,
      startMs: cast.startMs,
      resolveMs: cast.startMs + cast.template.telegraphMs,
    })
    log.push({
      id: nextLogId(),
      timeMs,
      message: `${cast.template.name}: ${cast.template.callout} (${cast.template.instruction})`,
      kind: 'info',
    })
    nextCastIndex++
  }

  // Resolve any mechanics whose timer has expired.
  const stillActive: ActiveMechanic[] = []
  for (const mech of active) {
    if (timeMs < mech.resolveMs) {
      stillActive.push(mech)
      continue
    }
    const inside = mech.shape ? isInsideShape(pos, mech.shape) : true
    const hit = mech.template.mode === 'avoid' ? inside : !inside
    if (hit) {
      hp = Math.max(0, hp - mech.template.damage)
      log.push({
        id: nextLogId(),
        timeMs,
        message: `${mech.template.name} hit you for ${mech.template.damage}.`,
        kind: 'damage',
      })
    } else {
      log.push({
        id: nextLogId(),
        timeMs,
        message: `${mech.template.name} resolved safely.`,
        kind: 'safe',
      })
    }
  }
  active = stillActive

  let status: EncounterStatus = state.status
  if (hp <= 0) {
    status = 'failed'
    log.push({ id: nextLogId(), timeMs, message: 'You have been defeated.', kind: 'fail' })
  } else if (nextCastIndex >= encounter.timeline.length && active.length === 0) {
    status = 'cleared'
    log.push({ id: nextLogId(), timeMs, message: 'Encounter clear!', kind: 'clear' })
  }

  return {
    timeMs,
    status,
    player: { pos, hp, maxHp: state.player.maxHp },
    bossPos: state.bossPos,
    active,
    nextCastIndex,
    log,
  }
}
