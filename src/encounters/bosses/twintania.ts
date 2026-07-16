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

const GHOST_RING_RADIUS = 11
const GHOST_COUNT = 7
const TWISTER_MARK_RADIUS = 3

/** Fixed positions for the 7 simulated raid members, clustered in a ring with gaps to dodge through. */
const ghostPositions = Array.from({ length: GHOST_COUNT }, (_, i) => {
  const angle = -Math.PI / 2 + (i / GHOST_COUNT) * Math.PI * 2
  return {
    x: Math.cos(angle) * GHOST_RING_RADIUS,
    y: Math.sin(angle) * GHOST_RING_RADIUS,
  }
})

export const twister: MechanicTemplate = {
  id: 'twintania-twister',
  name: 'Twister',
  callout: 'The boss begins a long, ominous cast.',
  instruction: 'in a few seconds you and 7 others get marked — clear every mark before they erupt',
  telegraphMs: 5000,
  markDelayMs: 3750,
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
    bossPos: { x: 0, y: -15 },
    playerStart: { x: 0, y: 13 },
    playerMaxHp: 160,
    playerSpeed: 9,
  },
  mechanics: [cyclonicWing, wingBlades, rearLaser, twister],
}
