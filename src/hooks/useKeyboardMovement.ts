import { useEffect, useRef } from 'react'
import type { Vector2 } from '../engine/vector'
import { normalize } from '../engine/vector'

const KEY_DIRECTIONS: Record<string, Vector2> = {
  w: { x: 0, y: -1 },
  arrowup: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  arrowdown: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  arrowleft: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  arrowright: { x: 1, y: 0 },
}

/**
 * Tracks held WASD/arrow keys and exposes a ref with the current normalized
 * movement direction, read once per frame by the game loop (avoids re-rendering
 * React on every keystroke).
 */
export function useKeyboardMovement() {
  const heldKeys = useRef(new Set<string>())
  const direction = useRef<Vector2>({ x: 0, y: 0 })

  useEffect(() => {
    const recompute = () => {
      let x = 0
      let y = 0
      for (const key of heldKeys.current) {
        const dir = KEY_DIRECTIONS[key]
        if (dir) {
          x += dir.x
          y += dir.y
        }
      }
      direction.current = normalize({ x, y })
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (!(key in KEY_DIRECTIONS)) return
      heldKeys.current.add(key)
      recompute()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      heldKeys.current.delete(key)
      recompute()
    }
    const onBlur = () => {
      heldKeys.current.clear()
      recompute()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return direction
}
