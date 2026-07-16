import type { Vector2 } from './vector'
import { angleOf, distance, length, sub } from './vector'

/** Geometric hazard/safe-zone shapes used by FFXIV-style mechanics. */
export type Shape =
  | { kind: 'circle'; center: Vector2; radius: number }
  | { kind: 'donut'; center: Vector2; innerRadius: number; outerRadius: number }
  | { kind: 'line'; origin: Vector2; target: Vector2; width: number; length: number }
  | { kind: 'cone'; origin: Vector2; target: Vector2; angleWidthDeg: number; radius: number }
  | { kind: 'multiCircle'; circles: { center: Vector2; radius: number }[] }

export function isInsideShape(point: Vector2, shape: Shape): boolean {
  switch (shape.kind) {
    case 'circle':
      return distance(point, shape.center) <= shape.radius
    case 'donut': {
      const d = distance(point, shape.center)
      return d >= shape.innerRadius && d <= shape.outerRadius
    }
    case 'line': {
      const dir = sub(shape.target, shape.origin)
      const dirLen = length(dir)
      if (dirLen === 0) return false
      const unit = { x: dir.x / dirLen, y: dir.y / dirLen }
      const rel = sub(point, shape.origin)
      const along = rel.x * unit.x + rel.y * unit.y
      const perp = Math.abs(rel.x * -unit.y + rel.y * unit.x)
      return along >= 0 && along <= shape.length && perp <= shape.width / 2
    }
    case 'cone': {
      const toPoint = sub(point, shape.origin)
      const dist = length(toPoint)
      if (dist > shape.radius) return false
      const toTarget = sub(shape.target, shape.origin)
      const diff = Math.abs(angleOf(toPoint) - angleOf(toTarget))
      const normalizedDiff = Math.min(diff, 2 * Math.PI - diff)
      return normalizedDiff <= (shape.angleWidthDeg * Math.PI) / 180 / 2
    }
    case 'multiCircle':
      return shape.circles.some((c) => distance(point, c.center) <= c.radius)
  }
}

/** Whether the mechanic damages you for standing in its shape, or for standing outside it (a soak/tower). */
export type ResolveMode = 'avoid' | 'soak'

export interface MechanicContext {
  bossPos: Vector2
  playerPos: Vector2
}

export interface MechanicTemplate {
  id: string
  name: string
  /** Flavor text shown the moment the telegraph appears. */
  callout: string
  /** How the shape is instructed to resolve, shown alongside the callout. */
  instruction: string
  /** Time in ms from telegraph appearing to the mechanic resolving. */
  telegraphMs: number
  /**
   * Ms after the telegraph appears before the hazard shape is captured/revealed.
   * Defaults to 0 (captured immediately, same instant the telegraph appears).
   * Useful for long casts whose AoE location isn't fixed until partway through
   * (e.g. a mark-under-you mechanic where the mark lands wherever you are a
   * couple seconds into the cast).
   */
  markDelayMs?: number
  damage: number
  mode: ResolveMode
  /**
   * Builds the hazard/safe-zone shape at the moment it's captured/revealed
   * (see markDelayMs). Omit to make the mechanic unavoidable (e.g. a
   * raidwide) — it always hits.
   */
  makeShape?: (ctx: MechanicContext) => Shape
}

export interface CastEvent {
  /** Absolute time in ms from encounter start when this telegraph appears. */
  startMs: number
  template: MechanicTemplate
}

export interface ActiveMechanic {
  instanceId: string
  template: MechanicTemplate
  shape: Shape | null
  startMs: number
  resolveMs: number
}
