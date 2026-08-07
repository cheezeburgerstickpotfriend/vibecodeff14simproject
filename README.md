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

Open the printed local URL. Pick a fight from the **Fight** picker and which
**Role** you're playing (tank/healer/DPS — this filters the mechanic list to
what that role actually deals with, e.g. tankbusters only show up for Tank),
then check/uncheck which mechanics you want in it, and optionally turn on
**Randomize order** (shuffles the mechanic sequence) and/or **Overlap
mechanics** (casts them two at a time instead of one after another, so you
have to satisfy both at once). Click **Start Encounter** and move with WASD
or the arrow keys. Some mechanics are an instant kill on a hit (flagged
**INSTANT DEATH** in the HUD) rather than just heavy damage — matching
mechanics that are genuinely lethal in the real fight.

## Project structure

- `src/engine/` — framework-agnostic simulation core, with no knowledge of
  any specific boss:
  - `vector.ts` — 2D vector math.
  - `mechanics.ts` — hazard/safe-zone `Shape`s (circle, donut, line, cone,
    multiCircle, travelingCircle) and hit-testing, the
    `MechanicTemplate`/`CastEvent`/`ActiveMechanic` types, and
    `mechanicProgress`/`shapeAtProgress` — the pair that drives moving
    telegraphs (see below), used identically by both simulation and rendering
    so they never desync.
  - `boss.ts` — `BossDefinition` (a fight's id, arena/player meta, and its
    mechanic pool).
  - `role.ts` — `Role` (`'tank' | 'healer' | 'dps'`), used to filter a boss's
    mechanic pool down to what each role actually deals with.
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
    Rippling Flames, Flame Lance, Tail Swing, Meteor Impact, and Magma Wave —
    a circle that sweeps across the arena and is dangerous continuously along
    its path, not just at one final spot) plus its arena/boss/player meta.
  - `twintania.ts` — the real UCoB phase-1 kit, authored as the fight's three
    actual rotations back to back (one loop each, condensed from the real
    ~3-minute/multi-loop encounter — Liquid Hell's full 5-hit barrages already
    make a single pass comparable in length to the real fight):
    - **Pull (100-74%)**: Plummet (tank cleave opener), Twister (lethal — a 2s
      cast whose mark isn't revealed until 1.5s in, landing on you and 7 fixed
      "ghost" party members), Fireball (a stack mechanic normally shared with
      the party; solo, you take it all), Death Sentence (tankbuster).
    - **74%-44%** (1st Neurolink drop): `liquidHellDistance` (a barrage of 5
      fire puddles, each dropped at wherever you're currently standing — see
      `repeatMarks` below), Generate (`generatePhase1`, lethal soak against
      the one active Neurolink zone), repeated, then
      Death Sentence/Generate/Twister/Plummet again.
    - **44%-0%** (2nd Neurolink drop): the same shape, but Generate is now
      `generatePhase2` (soaks against both Neurolinks) and a targeted,
      unbaitable `liquidHellTarget` barrage replaces the second Liquid Hell
      round. (Real-fight nuance not modeled: Mana Hypersensitivity, which
      would make a second hatch hit always lethal — moot for a solo sim,
      since it only matters if you'd otherwise go intercept a hatch meant for
      someone else.)

    Neurolink positions/sizes were reverse-engineered from a reference
    diagram; a third Neurolink position exists in the data (dropped only once
    Twintania is defeated) but isn't used by any live mechanic in phase 1.
    Role filtering narrows this to what each role deals with: tanks get
    Plummet/Death Sentence only; Generate only ever marks a DPS; Liquid Hell
    can hit healers or DPS but never a tank; everyone gets Twister/Fireball.
  - `index.ts` — exports `allBosses`, the registry of every fight.
- `src/hooks/` — `useGameLoop` (requestAnimationFrame ticking) and
  `useKeyboardMovement` (WASD/arrow input).
- `src/components/` — `Arena` (SVG rendering of telegraphs/boss/player),
  `Hud` (HP bar, timer, active mechanic callouts, an INSTANT DEATH tag for
  lethal mechanics — handles any number of simultaneously active mechanics),
  `EventLog`, `BossPicker` (choose which registered fight to play),
  `RoleSelector` (choose tank/healer/DPS), `MechanicSelector` (checkboxes to
  enable/disable mechanics + randomize/overlap toggles, shown per-role).

## Adding a new mechanic to a fight

Add a `MechanicTemplate` to that boss's file (e.g.
`src/encounters/bosses/theFirstTelegraph.ts`) — pick a `Shape` kind (circle,
donut, line, cone, `multiCircle` for several hazard circles at once, or
`travelingCircle` for one that moves), a `mode` of `'avoid'` or `'soak'`,
damage, and telegraph duration — then add it to that boss's `mechanics`
array. It'll automatically show up in the in-app selector for that fight.

Two optional fields cover trickier mechanics:

- `markDelayMs` — if the AoE's location shouldn't be decided until partway
  through a cast (a mark-under-you mechanic), set this to how many ms after
  the telegraph appears the mark should land. See `twister` in
  `twintania.ts`: a 2s cast that marks the player's position 1.5s in,
  combined with 7 fixed "ghost" positions via `multiCircle`. The HUD's
  countdown still runs for the mechanic's full telegraph from the moment
  it's cast, not just from when the mark is revealed.
- `continuous` — for a mechanic that should be dangerous throughout its
  telegraph rather than only at one final instant (typically paired with a
  moving shape like `travelingCircle`). It's hit-tested every tick from the
  moment it's revealed, ending the mechanic immediately on the first tick
  you're caught; if you're never caught, it resolves safely once its
  telegraph runs out. See `magmaWave` in `theFirstTelegraph.ts`.

Two more optional fields:

- `lethal` — a hit ends the encounter immediately regardless of remaining HP
  (and `damage` becomes irrelevant, safe to omit). Use for mechanics that are
  a genuine instant kill in the real fight, like `twister`, `generatePhase1/2`,
  and the `liquidHell*` mechanics in `twintania.ts`.
- `roles` — an array of `Role` (`'tank' | 'healer' | 'dps'`) this mechanic is
  relevant to. Omit for a mechanic everyone deals with regardless of role
  (Twister, Fireball); set it for role-specific ones (`['tank']` for a
  tankbuster, `['dps']` for Generate — it only ever marks a DPS). The
  `RoleSelector` filters a boss's `mechanics` array down to whichever role is
  selected before it ever reaches the picker or the timeline, repeats and
  order intact — so an authored `mechanics` array like Twintania's (three
  distinct phase rotations back to back) reproduces a role-appropriate slice
  of the real fight's sequence without needing a separate timeline per role.
- `repeatMarks: { count, intervalMs, igniteDelayMs? }` — for a mechanic that
  drops several marks over time instead of one (e.g. a barrage of ground
  AoEs), rather than a single reveal at `markDelayMs`. Each mark is a fresh
  `makeShape` call (so a mark-at-player mechanic captures wherever you
  currently are) and accumulates into a growing `multiCircle` rather than
  replacing the last one; pair with `continuous: true` so stepping into any
  accumulated mark is caught, and set `telegraphMs` to cover the last mark's
  time plus however long the whole group should keep lingering afterward.
  `igniteDelayMs` (default 0) is the grace period between a mark landing and
  it starting to count as a hazard — since a mark-at-player mechanic is by
  definition created exactly on top of you, leaving this at 0 with
  `continuous: true` would kill you the instant it's placed no matter how you
  later move; give it a real delay (a few hundred ms) so there's a moment to
  step off the spot you were just standing on. See `liquidHellDistance` and
  `liquidHellTarget` in `twintania.ts`: 5 marks 1.5s apart, each igniting
  700ms after it lands, all lingering together for 4s after the last one.

## Adding a new boss/fight

Create a new file in `src/encounters/bosses/` following the shape of
`theFirstTelegraph.ts`: its own `MechanicTemplate`s and a `BossDefinition`
(`id`, `meta` — arena size, boss/player position, HP, speed — and
`mechanics`). Register it in `src/encounters/bosses/index.ts`'s `allBosses`
array — it'll automatically appear in the `BossPicker`.

## Next steps

- Job-specific defensive cooldowns (e.g. a mitigation button on a cooldown).
- More moving-telegraph shapes (a growing/shrinking circle, a rotating cone).
- Per-mechanic difficulty/damage tuning from the UI.
- Groups of more than two simultaneous mechanics.
- A real boss-HP/DPS model, so HP-gated phases (like Twintania's Neurolinks)
  can trigger on actual percentage thresholds instead of fixed sequence
  position.
- The rest of The Unending Coil of Bahamut: Nael deus Darnus, Bahamut Prime,
  the combined Nael+Twintania phase, and the final golden Bahamut Prime.
