export interface Vector2 {
  x: number
  y: number
}

export const add = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y })

export const sub = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y })

export const scale = (a: Vector2, s: number): Vector2 => ({ x: a.x * s, y: a.y * s })

export const length = (a: Vector2): number => Math.hypot(a.x, a.y)

export const distance = (a: Vector2, b: Vector2): number => length(sub(a, b))

export const normalize = (a: Vector2): Vector2 => {
  const len = length(a)
  return len === 0 ? { x: 0, y: 0 } : scale(a, 1 / len)
}

export const angleOf = (a: Vector2): number => Math.atan2(a.y, a.x)

/** Clamps a point to lie within `radius` of `center`, preserving direction. */
export const clampToCircle = (p: Vector2, center: Vector2, radius: number): Vector2 => {
  const d = sub(p, center)
  const len = length(d)
  if (len <= radius) return p
  return add(center, scale(d, radius / len))
}
