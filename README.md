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

Open the printed local URL. Pick a fight from the **Fight** picker, then
check/uncheck which mechanics you want in it, and optionally turn on
**Randomize order** (shuffles the mechanic sequence) and/or **Overlap
mechanics** (casts them two at a time instead of one after another, so you
have to satisfy both at once). Click **Start Encounter** and move with WASD
or the arrow keys.

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
  - `theFirstTelegraph.ts` — mechanic templates (Ultimate Wrath, Cataclysm,
    Rippling Flames, Flame Lance, Tail Swing, Meteor Impact) plus its
    arena/boss/player meta.
  - `twintania.ts` — mechanic templates (Cyclonic Wing, Wing Blades, Rear
    Laser, and Twister — a long cast whose mark location isn't revealed
    until partway through, landing on you and 7 fixed "ghost" party members
    clustered with gaps to dodge through) plus its arena/boss/player meta.
  - `index.ts` — exports `allBosses`, the registry of every fight.
- `src/hooks/` — `useGameLoop` (requestAnimationFrame ticking) and
  `useKeyboardMovement` (WASD/arrow input).
- `src/components/` — `Arena` (SVG rendering of telegraphs/boss/player),
  `Hud` (HP bar, timer, active mechanic callouts — handles any number of
  simultaneously active mechanics), `EventLog`, `BossPicker` (choose which
  registered fight to play), `MechanicSelector` (checkboxes to enable/disable
  mechanics + randomize/overlap toggles).

## Adding a new mechanic to a fight

Add a `MechanicTemplate` to that boss's file (e.g.
`src/encounters/bosses/theFirstTelegraph.ts`) — pick a `Shape` kind (circle,
donut, line, cone, or `multiCircle` for several hazard circles at once), a
`mode` of `'avoid'` or `'soak'`, damage, and telegraph duration — then add it
to that boss's `mechanics` array. It'll automatically show up in the in-app
selector for that fight. If the AoE's location shouldn't be decided until
partway through a longer cast (a mark-under-you mechanic), set `markDelayMs`
to how many ms after the telegraph appears the mark should land — see
`twister` in `twintania.ts` for an example that marks the player's position
2.75s into a 5s cast, combined with 7 fixed "ghost" positions via
`multiCircle`.

## Adding a new boss/fight

Create a new file in `src/encounters/bosses/` following the shape of
`theFirstTelegraph.ts`: its own `MechanicTemplate`s and a `BossDefinition`
(`id`, `meta` — arena size, boss/player position, HP, speed — and
`mechanics`). Register it in `src/encounters/bosses/index.ts`'s `allBosses`
array — it'll automatically appear in the `BossPicker`.

## Next steps

- Job-specific defensive cooldowns (e.g. a mitigation button on a cooldown).
- Move telegraphs (e.g. a spreading circle that grows before it resolves).
- Per-mechanic difficulty/damage tuning from the UI.
- Groups of more than two simultaneous mechanics.
