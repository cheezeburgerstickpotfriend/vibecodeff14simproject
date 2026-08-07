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

const NEUROLINK_RADIUS = 2

/**
 * Fixed Neurolink drop points, approximated from a reference diagram of the
 * arena. The first two accumulate across the fight (only "d" is active after
 * the first drop at 74%, "d" + "two" after the second at 44%). "one" drops
 * only once Twintania is defeated — it's end-of-phase setup, not something
 * you ever have to soak a live Hatch in during phase 1.
 */
const neurolinkPositions = {
  d: { x: 9, y: 6 },
  two: { x: -9, y: 6 },
  one: { x: 0, y: -10 },
}

function neurolinkShape(active: { x: number; y: number }[]) {
  return {
    kind: 'multiCircle' as const,
    circles: active.map((center) => ({ center, radius: NEUROLINK_RADIUS })),
  }
}

const generateBase = {
  mode: 'soak' as const,
  lethal: true,
  roles: ['dps'] as Role[], // Generate always marks a random DPS, never a tank or healer
  telegraphMs: 4000,
}

export const generatePhase1: MechanicTemplate = {
  ...generateBase,
  id: 'twintania-generate-1',
  name: 'Generate',
  callout: 'A hatch drifts toward a random ally.',
  instruction: 'get inside the Neurolink before the hatch arrives, or it wipes the raid',
  makeShape: () => neurolinkShape([neurolinkPositions.d]),
}

export const generatePhase2: MechanicTemplate = {
  ...generateBase,
  id: 'twintania-generate-2',
  name: 'Generate (Double)',
  callout: 'Two hatches drift toward random allies at once.',
  instruction: 'get inside either Neurolink before the hatches arrive — a second hit is always lethal',
  makeShape: () => neurolinkShape([neurolinkPositions.d, neurolinkPositions.two]),
}

const LIQUID_HELL_RADIUS = 3

const liquidHellBase = {
  mode: 'avoid' as const,
  lethal: true,
  roles: ['healer', 'dps'] as Role[], // Twintania targets whoever is out at range, never the tank
  telegraphMs: 2000,
}

export const liquidHellDistance: MechanicTemplate = {
  ...liquidHellBase,
  id: 'twintania-liquid-hell-distance',
  name: 'Liquid Hell',
  callout: 'A fire puddle begins forming beneath you.',
  instruction: 'move off the puddle before it ignites',
  makeShape: ({ playerPos }) => ({ kind: 'circle', center: playerPos, radius: LIQUID_HELL_RADIUS }),
}

export const liquidHellTarget: MechanicTemplate = {
  ...liquidHellBase,
  id: 'twintania-liquid-hell-target',
  name: 'Liquid Hell (Targeted)',
  callout: "A fire puddle begins forming beneath you — this one can't be baited away.",
  instruction: 'move off the puddle before it ignites',
  makeShape: ({ playerPos }) => ({ kind: 'circle', center: playerPos, radius: LIQUID_HELL_RADIUS }),
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

const FIVE = [0, 1, 2, 3, 4]

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
  // Authored as the fight's three real, distinct rotations (one loop each,
  // condensed from the real ~3-minute/multi-loop encounter for playability —
  // Liquid Hell's 5-hit barrages already make a single pass through all three
  // comparable in length to the real fight):
  //
  // Pull (100-74%): Plummet, Twister+Fireball, Death Sentence.
  // 74-44% (1st Neurolink @ D): Liquid Hell x5, Generate, Liquid Hell x5,
  //   Death Sentence, Generate, Twister, Plummet.
  // 44-0% (2nd Neurolink @ "2"; every Generate is now doubled and soaks
  //   against both Neurolinks): Liquid Hell x5, Generate x2, targeted
  //   Liquid Hell x5, Fireball, Death Sentence, Generate, Twister, Plummet.
  //
  // Role filtering narrows this to what each role deals with: tanks get
  // Plummet/Death Sentence but not Generate/Liquid Hell; DPS get everything;
  // healers get Liquid Hell and Twister/Fireball but not Generate (Generate
  // only ever marks a DPS).
  mechanics: [
    // --- Pull (100%-74%) ---
    plummet,
    twister,
    fireball,
    deathSentence,

    // --- First Neurolink drop (74%-44%) ---
    ...FIVE.map(() => liquidHellDistance),
    generatePhase1,
    ...FIVE.map(() => liquidHellDistance),
    deathSentence,
    generatePhase1,
    twister,
    plummet,

    // --- Second Neurolink drop (44%-0%) ---
    ...FIVE.map(() => liquidHellDistance),
    generatePhase2,
    generatePhase2,
    ...FIVE.map(() => liquidHellTarget),
    fireball,
    deathSentence,
    generatePhase2,
    twister,
    plummet,
  ],
}
