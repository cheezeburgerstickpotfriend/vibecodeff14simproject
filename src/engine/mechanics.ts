import type { Vector2 } from './vector'
import { angleOf, distance, length, lerp, sub } from './vector'

/** Geometric hazard/safe-zone shapes used by FFXIV-style mechanics. */
export type Shape =
  | { kind: 'circle'; center: Vector2; radius: number }
  | { kind: 'donut'; center: Vector2; innerRadius: number; outerRadius: number }
  | { kind: 'line'; origin: Vector2; target: Vector2; width: number; length: number }
  | { kind: 'cone'; origin: Vector2; target: Vector2; angleWidthDeg: number; radius: number }
  | { kind: 'multiCircle'; circles: { center: Vector2; radius: number }[] }
  | { kind: 'travelingCircle'; from: Vector2; to: Vector2; radius: number }

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
    case 'travelingCircle':
      // Called directly (without going through shapeAtProgress first), so
      // fall back to testing wherever the shape ends up.
      return distance(point, shape.to) <= shape.radius
  }
}

/**
 * Resolves a shape that moves over time into a static one at a given
 * progress (0 = just revealed, 1 = resolving). Shapes that don't move are
 * returned unchanged.
 */
export function shapeAtProgress(shape: Shape, progress: number) {
  if (shape.kind === 'travelingCircle') {
    return { kind: 'circle' as const, center: lerp(shape.from, shape.to, progress), radius: shape.radius }
  }
  return shape
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
   * If true, the mechanic damages you the instant you're caught inside its
   * (possibly moving) shape at any point after it's revealed, instead of
   * only checking once at resolution — it then ends immediately on that
   * first hit. If you're never caught, it resolves safely as usual once its
   * telegraph runs out. Meant for shapes that are dangerous throughout their
   * motion (e.g. a travelingCircle sweeping across the arena), not just at
   * their final position.
   */
  continuous?: boolean
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

/** 0 right as the mechanic's shape is revealed, 1 at resolution. Drives shape movement and continuous hit-testing. */
export function mechanicProgress(mech: ActiveMechanic, timeMs: number): number {
  const revealAtMs = mech.startMs + (mech.template.markDelayMs ?? 0)
  const duration = mech.resolveMs - revealAtMs
  if (duration <= 0) return 1
  return Math.min(1, Math.max(0, (timeMs - revealAtMs) / duration))
}
