import type { BossDefinition } from '../../engine/boss'
import type { MechanicTemplate } from '../../engine/mechanics'

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

const NEUROLINK_RADIUS = 6

export const hatch: MechanicTemplate = {
  id: 'twintania-hatch',
  name: 'Hatch',
  callout: 'A hatch drifts toward you as a Neurolink opens beneath the boss.',
  instruction: 'be standing in the Neurolink when the hatch arrives, or it detonates on the whole raid',
  telegraphMs: 4000,
  mode: 'soak',
  lethal: true,
  roles: ['healer', 'dps'],
  makeShape: ({ bossPos }) => ({ kind: 'circle', center: bossPos, radius: NEUROLINK_RADIUS }),
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
  // Sentence on repeat, with a Hatch (soaked in the Neurolink under the boss)
  // dropped roughly every loop — approximating the real fight's 74%/44%/0%
  // HP-gated Neurolink phases as fixed points in a condensed sequence, since
  // this sim has no boss HP/DPS model to gate on directly. Role filtering
  // narrows this same authored order down to what each role actually deals
  // with: tanks get Plummet/Death Sentence but no Hatch, healers/DPS get
  // Hatch but not the tankbusters, everyone gets Twister.
  mechanics: [
    plummet,
    twister,
    fireball,
    deathSentence,
    hatch,
    twister,
    fireball,
    deathSentence,
    hatch,
    twister,
    fireball,
    deathSentence,
    hatch,
  ],
}
