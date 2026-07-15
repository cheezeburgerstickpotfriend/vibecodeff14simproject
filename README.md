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

Open the printed local URL, click **Start Encounter**, and move with WASD or
the arrow keys.

## Project structure

- `src/engine/` — framework-agnostic simulation core:
  - `vector.ts` — 2D vector math.
  - `mechanics.ts` — hazard/safe-zone `Shape`s (circle, donut, line, cone) and
    hit-testing, plus the `MechanicTemplate`/`CastEvent`/`ActiveMechanic` types.
  - `simulation.ts` — `GameState`, `initGameState`, and the pure
    `stepSimulation(state, dtMs, moveDir, encounter)` reducer that drives
    movement, telegraph spawning, and mechanic resolution.
- `src/encounters/` — content built on the engine:
  - `mechanicLibrary.ts` — reusable mechanic templates (raidwide, Cataclysm,
    Rippling Flames, Twister, Tail Swing, Meteor Impact).
  - `sampleEncounter.ts` — the arena config and timeline for the current
    sample fight.
- `src/hooks/` — `useGameLoop` (requestAnimationFrame ticking) and
  `useKeyboardMovement` (WASD/arrow input).
- `src/components/` — `Arena` (SVG rendering of telegraphs/boss/player),
  `Hud` (HP bar, timer, active mechanic callouts), `EventLog`.

## Adding a new mechanic

Add a `MechanicTemplate` to `src/encounters/mechanicLibrary.ts` (pick a
`Shape` kind, a `mode` of `'avoid'` or `'soak'`, damage, and telegraph
duration), then reference it in an encounter's `timeline`.

## Adding a new encounter

Copy the shape of `src/encounters/sampleEncounter.ts` — arena size, boss
position, player start, HP, and an ordered `timeline` of `{ startMs,
template }` casts — and swap it in wherever `App.tsx` imports
`sampleEncounter`.

## Next steps

- Multiple/overlapping simultaneous mechanics.
- Job-specific defensive cooldowns (e.g. a mitigation button on a cooldown).
- An encounter picker instead of a single hardcoded fight.
- Move telegraphs (e.g. a spreading circle that grows before it resolves).
