import type { BossDefinition } from './boss'
import type { CastEvent, MechanicTemplate } from './mechanics'
import type { Encounter } from './simulation'

export interface TimelineOptions {
  /** Time in ms before the first mechanic's telegraph appears. */
  startDelayMs: number
  /** Gap in ms between one mechanic (or group) resolving and the next telegraph appearing. */
  gapMs: number
}

/** One beat of the timeline: a single mechanic, or several cast simultaneously. */
export type TimelineEntry = MechanicTemplate | MechanicTemplate[]

/** Lays out a sequence of timeline entries back-to-back into an absolute-time timeline. */
export function buildTimeline(entries: TimelineEntry[], options: TimelineOptions): CastEvent[] {
  const timeline: CastEvent[] = []
  let t = options.startDelayMs
  for (const entry of entries) {
    const group = Array.isArray(entry) ? entry : [entry]
    for (const template of group) {
      timeline.push({ startMs: t, template })
    }
    const groupDurationMs = Math.max(...group.map((template) => template.telegraphMs))
    t += groupDurationMs + options.gapMs
  }
  return timeline
}

/** Fisher-Yates shuffle; does not mutate the input. */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Groups a list into consecutive pairs (a leftover odd one out stays solo), for simultaneous casts. */
export function groupInPairs(templates: MechanicTemplate[]): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  for (let i = 0; i < templates.length; i += 2) {
    entries.push(i + 1 < templates.length ? [templates[i], templates[i + 1]] : templates[i])
  }
  return entries
}

const TIMELINE_OPTIONS: TimelineOptions = { startDelayMs: 2000, gapMs: 3000 }

export interface BuildEncounterOptions {
  randomize: boolean
  overlap: boolean
}

/** Builds a full Encounter for a boss from a chosen set of its mechanics. */
export function buildEncounter(
  boss: BossDefinition,
  selected: MechanicTemplate[],
  options: BuildEncounterOptions,
): Encounter {
  const order = options.randomize ? shuffle(selected) : selected
  const entries = options.overlap ? groupInPairs(order) : order
  return {
    ...boss.meta,
    timeline: buildTimeline(entries, TIMELINE_OPTIONS),
  }
}
