import type { BossDefinition } from '../../engine/boss'
import type { MechanicTemplate } from '../../engine/mechanics'

export const raidwide: MechanicTemplate = {
  id: 'raidwide',
  name: 'Ultimate Wrath',
  callout: 'The boss channels a raid-wide nuke.',
  instruction: 'unavoidable — just take it',
  telegraphMs: 3000,
  damage: 15,
  mode: 'avoid',
  // no makeShape => always hits, regardless of position
}

export const pointBlankAoe: MechanicTemplate = {
  id: 'point-blank-aoe',
  name: 'Cataclysm',
  callout: 'The boss draws in power around itself.',
  instruction: 'get far away from the boss',
  telegraphMs: 4000,
  damage: 45,
  mode: 'avoid',
  makeShape: ({ bossPos }) => ({ kind: 'circle', center: bossPos, radius: 14 }),
}

export const donutAoe: MechanicTemplate = {
  id: 'donut-aoe',
  name: 'Rippling Flames',
  callout: 'A shockwave ripples outward from the boss.',
  instruction: 'get in close to the boss',
  telegraphMs: 4000,
  damage: 45,
  mode: 'avoid',
  makeShape: ({ bossPos }) => ({ kind: 'donut', center: bossPos, innerRadius: 7, outerRadius: 40 }),
}

export const lineCleave: MechanicTemplate = {
  id: 'line-cleave',
  name: 'Flame Lance',
  callout: 'The boss locks on to your position with a beam.',
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

export const tailSwing: MechanicTemplate = {
  id: 'cone-aoe',
  name: 'Tail Swing',
  callout: 'The boss winds up a frontal cleave.',
  instruction: 'move outside the frontal cone',
  telegraphMs: 3000,
  damage: 35,
  mode: 'avoid',
  makeShape: ({ bossPos, playerPos }) => ({
    kind: 'cone',
    origin: bossPos,
    target: playerPos,
    angleWidthDeg: 100,
    radius: 22,
  }),
}

export const towerSoak: MechanicTemplate = {
  id: 'tower-soak',
  name: 'Meteor Impact',
  callout: 'A meteor marker locks onto a fixed point in the arena.',
  instruction: 'stand inside the tower before it drops',
  telegraphMs: 5000,
  damage: 55,
  mode: 'soak',
  makeShape: () => ({ kind: 'circle', center: { x: 9, y: 4 }, radius: 5 }),
}

export const magmaWave: MechanicTemplate = {
  id: 'magma-wave',
  name: 'Magma Wave',
  callout: 'A wave of magma begins sweeping across the arena.',
  instruction: 'get clear of its path and stay clear until it passes',
  telegraphMs: 4500,
  damage: 35,
  mode: 'avoid',
  continuous: true,
  makeShape: () => ({ kind: 'travelingCircle', from: { x: -17, y: 0 }, to: { x: 17, y: 0 }, radius: 5 }),
}

export const theFirstTelegraph: BossDefinition = {
  id: 'the-first-telegraph',
  meta: {
    name: 'Trial: The First Telegraph',
    arena: { center: { x: 0, y: 0 }, radius: 20 },
    bossPos: { x: 0, y: -14 },
    playerStart: { x: 0, y: 12 },
    playerMaxHp: 150,
    playerSpeed: 9,
  },
  mechanics: [raidwide, pointBlankAoe, donutAoe, lineCleave, tailSwing, towerSoak, magmaWave],
}
