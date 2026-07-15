import type { Encounter } from '../engine/simulation'
import {
  donutAoe,
  lineCleave,
  pointBlankAoe,
  raidwide,
  tailSwing,
  towerSoak,
} from './mechanicLibrary'

export const sampleEncounter: Encounter = {
  name: 'Trial: The First Telegraph',
  arena: { center: { x: 0, y: 0 }, radius: 20 },
  bossPos: { x: 0, y: -14 },
  playerStart: { x: 0, y: 12 },
  playerMaxHp: 150,
  playerSpeed: 9,
  timeline: [
    { startMs: 2000, template: raidwide },
    { startMs: 7000, template: pointBlankAoe },
    { startMs: 13000, template: donutAoe },
    { startMs: 19000, template: lineCleave },
    { startMs: 25000, template: towerSoak },
    { startMs: 31000, template: tailSwing },
    { startMs: 36000, template: raidwide },
  ],
}
