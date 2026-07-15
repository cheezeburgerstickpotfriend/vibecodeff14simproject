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
you want in the fight and optionally turn on **Randomize order**, then click
**Start Encounter** and move with WASD or the arrow keys.

## Project structure

- `src/engine/` — framework-agnostic simulation core:
  - `vector.ts` — 2D vector math.
  - `mechanics.ts` — hazard/safe-zone `Shape`s (circle, donut, line, cone) and
    hit-testing, plus the `MechanicTemplate`/`CastEvent`/`ActiveMechanic` types.
  - `simulation.ts` — `GameState`, `initGameState`, and the pure
    `stepSimulation(state, dtMs, moveDir, encounter)` reducer that drives
    movement, telegraph spawning, and mechanic resolution.
  - `encounterBuilder.ts` — `buildTimeline` (lays a list of mechanics out
    back-to-back into an absolute-time timeline) and `shuffle` (Fisher-Yates).
- `src/encounters/` — content built on the engine:
  - `mechanicLibrary.ts` — reusable mechanic templates (raidwide, Cataclysm,
    Rippling Flames, Twister, Tail Swing, Meteor Impact) plus `allMechanics`,
    the full pool to pick from.
  - `sampleEncounter.ts` — `encounterMeta` (arena, boss/player start, HP,
    speed) and `buildEncounter(selected, randomize)`, which turns a chosen
    subset of `allMechanics` into a full `Encounter`.
- `src/hooks/` — `useGameLoop` (requestAnimationFrame ticking) and
  `useKeyboardMovement` (WASD/arrow input).
- `src/components/` — `Arena` (SVG rendering of telegraphs/boss/player),
  `Hud` (HP bar, timer, active mechanic callouts), `EventLog`,
  `MechanicSelector` (checkboxes to enable/disable mechanics + the
  randomize-order toggle, shown while idle).

## Adding a new mechanic

Add a `MechanicTemplate` to `src/encounters/mechanicLibrary.ts` (pick a
`Shape` kind, a `mode` of `'avoid'` or `'soak'`, damage, and telegraph
duration), then add it to the `allMechanics` array — it'll automatically show
up in the in-app selector.

## Adding a new encounter

Copy the shape of `encounterMeta` in `src/encounters/sampleEncounter.ts` —
arena size, boss position, player start, HP, speed — and swap it in wherever
`App.tsx` imports it. `buildEncounter` handles turning whichever mechanics are
selected (and whether to randomize) into a timeline.

## Next steps

- Multiple/overlapping simultaneous mechanics.
- Job-specific defensive cooldowns (e.g. a mitigation button on a cooldown).
- Multiple selectable encounters instead of one hardcoded fight.
- Move telegraphs (e.g. a spreading circle that grows before it resolves).
- Per-mechanic difficulty/damage tuning from the UI.
