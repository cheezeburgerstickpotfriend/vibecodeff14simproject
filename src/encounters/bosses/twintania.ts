import type { BossDefinition } from '../../engine/boss'
import type { MechanicTemplate } from '../../engine/mechanics'

export const cyclonicWing: MechanicTemplate = {
  id: 'twintania-raidwide',
  name: 'Cyclonic Wing',
  callout: 'The boss beats its wings, buffeting the whole arena.',
  instruction: 'unavoidable — just take it',
  telegraphMs: 3000,
  damage: 15,
  mode: 'avoid',
  // no makeShape => always hits, regardless of position
}

export const wingBlades: MechanicTemplate = {
  id: 'twintania-point-blank',
  name: 'Wing Blades',
  callout: 'The boss folds its wings in, gathering force.',
  instruction: 'get far away from the boss',
  telegraphMs: 4000,
  damage: 40,
  mode: 'avoid',
  makeShape: ({ bossPos }) => ({ kind: 'circle', center: bossPos, radius: 13 }),
}

export const rearLaser: MechanicTemplate = {
  id: 'twintania-line-cleave',
  name: 'Rear Laser',
  callout: 'A targeting reticle locks on to you.',
  instruction: 'step off the line between you and the boss',
  telegraphMs: 3500,
  damage: 40,
  mode: 'avoid',
  makeShape: ({ bossPos, playerPos }) => ({
    kind: 'line',
    origin: bossPos,
    target: playerPos,
    width: 6,
    length: 45,
  }),
}

const BOSS_POS = { x: 0, y: -11 }
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
  instruction: 'you and 7 others get marked partway through — clear every mark before they erupt',
  telegraphMs: 2000,
  markDelayMs: 1500,
  damage: 50,
  mode: 'avoid',
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
  mechanics: [cyclonicWing, wingBlades, rearLaser, twister],
}
