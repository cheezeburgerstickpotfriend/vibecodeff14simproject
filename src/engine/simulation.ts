import type { CastEvent, ActiveMechanic, MechanicContext, Shape } from './mechanics'
import { isInsideShape, liveHazardShape, mechanicProgress, shapeAtProgress } from './mechanics'
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
 * Reveals a mechanic's hazard shape(s) as of `timeMs`: a single capture at
 * markDelayMs for ordinary mechanics, or — for `repeatMarks` mechanics — as
 * many accumulated marks (each a fresh makeShape call, unioned into a
 * growing multiCircle) as should have landed by now.
 */
function revealShape(
  mech: ActiveMechanic,
  timeMs: number,
  ctx: MechanicContext,
): { shape: Shape | null; marksRevealed: number; markTimestamps: number[] } {
  const { template } = mech
  if (!template.makeShape) {
    return { shape: mech.shape, marksRevealed: mech.marksRevealed ?? 0, markTimestamps: mech.markTimestamps ?? [] }
  }

  if (template.repeatMarks) {
    const { count, intervalMs } = template.repeatMarks
    let shape = mech.shape
    let marksRevealed = mech.marksRevealed ?? 0
    let markTimestamps = mech.markTimestamps ?? []
    while (
      marksRevealed < count &&
      timeMs >= mech.startMs + (template.markDelayMs ?? 0) + marksRevealed * intervalMs
    ) {
      const mark = template.makeShape(ctx)
      if (mark.kind === 'circle') {
        const existing = shape && shape.kind === 'multiCircle' ? shape.circles : []
        shape = { kind: 'multiCircle', circles: [...existing, { center: mark.center, radius: mark.radius }] }
        markTimestamps = [...markTimestamps, timeMs]
      }
      marksRevealed++
    }
    return { shape, marksRevealed, markTimestamps }
  }

  const revealAtMs = mech.startMs + (template.markDelayMs ?? 0)
  const shape = mech.shape === null && timeMs >= revealAtMs ? template.makeShape(ctx) : mech.shape
  return { shape, marksRevealed: 0, markTimestamps: [] }
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

  // Spawn any telegraphs whose start time has arrived. The hazard shape isn't
  // computed yet — see the reveal step below — so mechanics with a markDelayMs
  // stay invisible until their mark actually lands.
  while (nextCastIndex < encounter.timeline.length && encounter.timeline[nextCastIndex].startMs <= timeMs) {
    const cast = encounter.timeline[nextCastIndex]
    active.push({
      instanceId: `${cast.template.id}-${cast.startMs}`,
      template: cast.template,
      shape: null,
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

  // Reveal marks whose delay has elapsed, then resolve any mechanics whose timer has expired
  // (or, for continuous mechanics, the instant they catch you mid-flight).
  const stillActive: ActiveMechanic[] = []
  for (const mech of active) {
    const { shape, marksRevealed, markTimestamps } = revealShape(mech, timeMs, {
      bossPos: state.bossPos,
      playerPos: pos,
    })
    const revealedMech = { ...mech, shape, marksRevealed, markTimestamps }

    const hazardShape = liveHazardShape(revealedMech, timeMs)
    const liveShape = hazardShape ? shapeAtProgress(hazardShape, mechanicProgress(mech, timeMs)) : null
    const inside = liveShape ? isInsideShape(pos, liveShape) : true
    const hit = mech.template.mode === 'avoid' ? inside : !inside

    const shouldResolveNow = timeMs >= mech.resolveMs || (mech.template.continuous && liveShape !== null && hit)
    if (!shouldResolveNow) {
      stillActive.push(revealedMech)
      continue
    }

    if (hit && mech.template.lethal) {
      hp = 0
      log.push({
        id: nextLogId(),
        timeMs,
        message: `${mech.template.name} caught you — instant death.`,
        kind: 'damage',
      })
    } else if (hit) {
      const damage = mech.template.damage ?? 0
      hp = Math.max(0, hp - damage)
      log.push({
        id: nextLogId(),
        timeMs,
        message: `${mech.template.name} hit you for ${damage}.`,
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
