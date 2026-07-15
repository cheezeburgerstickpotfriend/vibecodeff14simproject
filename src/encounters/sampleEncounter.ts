import { buildTimeline, shuffle } from '../engine/encounterBuilder'
import type { MechanicTemplate } from '../engine/mechanics'
import type { Encounter } from '../engine/simulation'
import { allMechanics } from './mechanicLibrary'

export { allMechanics }

/** Static parts of the encounter that don't depend on which mechanics are selected. */
export const encounterMeta: Omit<Encounter, 'timeline'> = {
  name: 'Trial: The First Telegraph',
  arena: { center: { x: 0, y: 0 }, radius: 20 },
  bossPos: { x: 0, y: -14 },
  playerStart: { x: 0, y: 12 },
  playerMaxHp: 150,
  playerSpeed: 9,
}

const TIMELINE_OPTIONS = { startDelayMs: 2000, gapMs: 3000 }

/** Builds a full Encounter from a chosen set of mechanics, optionally shuffling their order. */
export function buildEncounter(selected: MechanicTemplate[], randomize: boolean): Encounter {
  const order = randomize ? shuffle(selected) : selected
  return {
    ...encounterMeta,
    timeline: buildTimeline(order, TIMELINE_OPTIONS),
  }
}
