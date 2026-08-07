import type { BossDefinition } from '../../engine/boss'
import type { MechanicTemplate } from '../../engine/mechanics'
import type { Role } from '../../engine/role'

const BOSS_POS = { x: 0, y: -11 }

export const plummet: MechanicTemplate = {
  id: 'twintania-plummet',
  name: 'Plummet',
  callout: 'The boss slams down in a heavy cleave.',
  instruction: 'brace for the tankbuster',
  telegraphMs: 1200,
  damage: 45,
  mode: 'avoid',
  roles: ['tank'],
  // no makeShape => always hits (it's aimed straight at you)
}

export const fireball: MechanicTemplate = {
  id: 'twintania-fireball',
  name: 'Fireball',
  callout: 'The boss marks you with a fireball.',
  instruction: 'normally shared with the party by stacking — solo, you take it all',
  telegraphMs: 4000,
  damage: 35,
  mode: 'avoid',
  // no makeShape => always hits
}

export const deathSentence: MechanicTemplate = {
  id: 'twintania-death-sentence',
  name: 'Death Sentence',
  callout: 'The boss marks you for execution.',
  instruction: 'brace for the tankbuster',
  telegraphMs: 2500,
  damage: 55,
  mode: 'avoid',
  roles: ['tank'],
}

const NEUROLINK_RADIUS = 5

/**
 * Fixed Neurolink drop points, approximated from a reference diagram of the
 * arena. They accumulate across the fight: only "d" is active the first time,
 * "d" + "two" the second, all three the third (matching Twintania dropping a
 * new Neurolink at each of her 74%/44%/0% HP thresholds without removing the
 * earlier ones).
 */
const neurolinkPositions = {
  d: { x: 9, y: 6 },
  two: { x: -11, y: 6 },
  one: { x: 0, y: -10 },
}

function neurolinkShape(active: { x: number; y: number }[]) {
  return {
    kind: 'multiCircle' as const,
    circles: active.map((center) => ({ center, radius: NEUROLINK_RADIUS })),
  }
}

const hatchBase = {
  mode: 'soak' as const,
  lethal: true,
  roles: ['healer', 'dps'] as Role[],
  telegraphMs: 4000,
}

export const hatchPhase1: MechanicTemplate = {
  ...hatchBase,
  id: 'twintania-hatch-1',
  name: 'Hatch (1st Neurolink)',
  callout: 'A Neurolink opens and a hatch drifts toward a random ally.',
  instruction: 'get inside the Neurolink before the hatch arrives, or it wipes the raid',
  makeShape: () => neurolinkShape([neurolinkPositions.d]),
}

export const hatchPhase2: MechanicTemplate = {
  ...hatchBase,
  id: 'twintania-hatch-2',
  name: 'Hatch (2nd Neurolink)',
  callout: 'A second Neurolink opens; hatches drift toward random allies.',
  instruction: 'get inside either Neurolink before the hatches arrive, or it wipes the raid',
  makeShape: () => neurolinkShape([neurolinkPositions.d, neurolinkPositions.two]),
}

export const hatchPhase3: MechanicTemplate = {
  ...hatchBase,
  id: 'twintania-hatch-3',
  name: 'Hatch (3rd Neurolink)',
  callout: 'A third Neurolink opens; hatches drift toward random allies.',
  instruction: 'get inside any Neurolink before the hatches arrive, or it wipes the raid',
  makeShape: () => neurolinkShape([neurolinkPositions.d, neurolinkPositions.two, neurolinkPositions.one]),
}

const TWISTER_MARK_RADIUS = 1.2

/**
 * Fixed positions for the 7 simulated raid members, laid out like a typical
 * raid stack relative to the boss: one north (in front), one to the
 * northeast, two just behind, and three further behind with room to spread
 * into (the player rounds out that back group as the 8th, dynamic mark).
 */
const ghostPositions = [
  { x: BOSS_POS.x, y: BOSS_POS.y - 4 }, // north, in front of the boss
  { x: BOSS_POS.x + 3, y: BOSS_POS.y - 2 }, // northeast
  { x: BOSS_POS.x - 3, y: BOSS_POS.y + 4 }, // behind, left
  { x: BOSS_POS.x + 3, y: BOSS_POS.y + 4 }, // behind, right
  { x: BOSS_POS.x - 6, y: BOSS_POS.y + 10 }, // further behind, left
  { x: BOSS_POS.x, y: BOSS_POS.y + 10 }, // further behind, center
  { x: BOSS_POS.x + 6, y: BOSS_POS.y + 10 }, // further behind, right
]

export const twister: MechanicTemplate = {
  id: 'twintania-twister',
  name: 'Twister',
  callout: 'The boss begins a short, ominous cast.',
  instruction: 'you and 7 others get marked partway through — touching any mark is instant death',
  telegraphMs: 2000,
  markDelayMs: 1500,
  mode: 'avoid',
  lethal: true,
  makeShape: ({ playerPos }) => ({
    kind: 'multiCircle',
    circles: [
      ...ghostPositions.map((center) => ({ center, radius: TWISTER_MARK_RADIUS })),
      { center: playerPos, radius: TWISTER_MARK_RADIUS },
    ],
  }),
}

export const twintania: BossDefinition = {
  id: 'twintania',
  meta: {
    name: 'Twintania',
    arena: { center: { x: 0, y: 0 }, radius: 22 },
    bossPos: BOSS_POS,
    playerStart: { x: 0, y: 13 },
    playerMaxHp: 160,
    playerSpeed: 9,
  },
  // Phase 1's real rotation: an opening tankbuster, then Twister/Fireball/Death
  // Sentence on repeat, with a Hatch dropped roughly every loop —
  // approximating the real fight's 74%/44%/0% HP-gated Neurolink phases as
  // fixed points in a condensed sequence, since this sim has no boss HP/DPS
  // model to gate on directly. Each Hatch phase adds one more cumulative
  // Neurolink (1st: D only, 2nd: D+2, 3rd: D+2+1). Role filtering narrows
  // this same authored order down to what each role actually deals with:
  // tanks get Plummet/Death Sentence but no Hatch, healers/DPS get Hatch but
  // not the tankbusters, everyone gets Twister.
  mechanics: [
    plummet,
    twister,
    fireball,
    deathSentence,
    hatchPhase1,
    twister,
    fireball,
    deathSentence,
    hatchPhase2,
    twister,
    fireball,
    deathSentence,
    hatchPhase3,
  ],
}
