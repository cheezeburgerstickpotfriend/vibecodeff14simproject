import { useEffect, useRef } from 'react'

const MAX_DT_MS = 50

/** Calls `onTick(dtMs)` once per animation frame while `running` is true. */
export function useGameLoop(onTick: (dtMs: number) => void, running: boolean) {
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick

  useEffect(() => {
    if (!running) return

    let frameId: number
    let lastTime = performance.now()

    const loop = (time: number) => {
      const dtMs = Math.min(time - lastTime, MAX_DT_MS)
      lastTime = time
      onTickRef.current(dtMs)
      frameId = requestAnimationFrame(loop)
    }

    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [running])
}
