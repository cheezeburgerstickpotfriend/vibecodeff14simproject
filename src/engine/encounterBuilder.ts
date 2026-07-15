import type { CastEvent, MechanicTemplate } from './mechanics'

export interface TimelineOptions {
  /** Time in ms before the first mechanic's telegraph appears. */
  startDelayMs: number
  /** Gap in ms between one mechanic resolving and the next telegraph appearing. */
  gapMs: number
}

/** Lays out a sequence of mechanics back-to-back into an absolute-time timeline. */
export function buildTimeline(templates: MechanicTemplate[], options: TimelineOptions): CastEvent[] {
  const timeline: CastEvent[] = []
  let t = options.startDelayMs
  for (const template of templates) {
    timeline.push({ startMs: t, template })
    t += template.telegraphMs + options.gapMs
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
