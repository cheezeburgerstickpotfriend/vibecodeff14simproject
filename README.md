# FFXIV Fight Simulator

A solo mechanics-dodging simulator inspired by Final Fantasy XIV boss fights.
You control a single player against a scripted boss: the boss telegraphs a
mechanic (raidwide, point-blank AoE, donut, line cleave, cone, tower soak),
and you have a few seconds to move into (or out of) the danger zone before it
resolves. There's no rotation, DPS, or healing — just reading telegraphs and
positioning correctly.

## Stack

TypeScript + React + Vite.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL. Before starting, check/uncheck which mechanics
you want in the fight, and optionally turn on **Randomize order** (shuffles
the mechanic sequence) and/or **Overlap mechanics** (casts them two at a
time instead of one after another, so you have to satisfy both at once).
Click **Start Encounter** and move with WASD or the arrow keys.

## Project structure

- `src/engine/` — framework-agnostic simulation core, with no knowledge of
  any specific boss:
  - `vector.ts` — 2D vector math.
  - `mechanics.ts` — hazard/safe-zone `Shape`s (circle, donut, line, cone) and
    hit-testing, plus the `MechanicTemplate`/`CastEvent`/`ActiveMechanic` types.
  - `boss.ts` — `BossDefinition` (a fight's id, arena/player meta, and its
    mechanic pool).
  - `simulation.ts` — `GameState`, `initGameState`, and the pure
    `stepSimulation(state, dtMs, moveDir, encounter)` reducer that drives
    movement, telegraph spawning, and mechanic resolution.
  - `encounterBuilder.ts` — turns a `BossDefinition` and a chosen subset of
    its mechanics into a concrete `Encounter`: `buildTimeline` (lays entries
    out back-to-back), `groupInPairs` (bundles mechanics into simultaneous
    pairs for overlap mode), `shuffle` (Fisher-Yates), and `buildEncounter`
    (ties it together given `{ randomize, overlap }`).
- `src/encounters/bosses/` — one file per fight, each a self-contained
  `BossDefinition`:
  - `theFirstTelegraph.ts` — the current (only) fight: its mechanic
    templates (Ultimate Wrath, Cataclysm, Rippling Flames, Twister, Tail
    Swing, Meteor Impact) plus its arena/boss/player meta.
  - `index.ts` — exports `allBosses`, the registry of every fight.
- `src/hooks/` — `useGameLoop` (requestAnimationFrame ticking) and
  `useKeyboardMovement` (WASD/arrow input).
- `src/components/` — `Arena` (SVG rendering of telegraphs/boss/player),
  `Hud` (HP bar, timer, active mechanic callouts — handles any number of
  simultaneously active mechanics), `EventLog`, `MechanicSelector`
  (checkboxes to enable/disable mechanics + randomize/overlap toggles).

## Adding a new mechanic to a fight

Add a `MechanicTemplate` to that boss's file (e.g.
`src/encounters/bosses/theFirstTelegraph.ts`) — pick a `Shape` kind, a
`mode` of `'avoid'` or `'soak'`, damage, and telegraph duration — then add it
to that boss's `mechanics` array. It'll automatically show up in the in-app
selector for that fight.

## Adding a new boss/fight

Create a new file in `src/encounters/bosses/` following the shape of
`theFirstTelegraph.ts`: its own `MechanicTemplate`s and a `BossDefinition`
(`id`, `meta` — arena size, boss/player position, HP, speed — and
`mechanics`). Register it in `src/encounters/bosses/index.ts`'s `allBosses`
array. `App.tsx` currently just plays `allBosses[0]`; once there's more than
one, swap that for a boss-picker.

## Next steps

- A boss-picker UI now that the engine supports more than one fight.
- Job-specific defensive cooldowns (e.g. a mitigation button on a cooldown).
- Move telegraphs (e.g. a spreading circle that grows before it resolves).
- Per-mechanic difficulty/damage tuning from the UI.
- Groups of more than two simultaneous mechanics.
