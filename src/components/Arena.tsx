import type { ActiveMechanic } from '../engine/mechanics'
import type { ArenaConfig } from '../engine/simulation'
import type { Vector2 } from '../engine/vector'

interface ArenaProps {
  arena: ArenaConfig
  bossPos: Vector2
  playerPos: Vector2
  active: ActiveMechanic[]
  timeMs: number
}

const VIEW_MARGIN = 6

/** How saturated/opaque a telegraph looks as it counts down to resolution: faint at cast, solid red right before it hits. */
function dangerOpacity(mech: ActiveMechanic, timeMs: number): number {
  const total = mech.resolveMs - mech.startMs
  const elapsed = timeMs - mech.startMs
  const progress = total <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / total))
  return 0.15 + progress * 0.55
}

function TelegraphShape({ mech, timeMs }: { mech: ActiveMechanic; timeMs: number }) {
  const { shape, template } = mech
  const opacity = dangerOpacity(mech, timeMs)
  const color = template.mode === 'soak' ? '#4ade80' : '#ef4444'

  if (!shape) return null

  switch (shape.kind) {
    case 'circle':
      return <circle cx={shape.center.x} cy={shape.center.y} r={shape.radius} fill={color} opacity={opacity} />
    case 'donut': {
      return (
        <path
          d={[
            describeCircle(shape.center, shape.outerRadius),
            describeCircle(shape.center, shape.innerRadius),
          ].join(' ')}
          fill={color}
          fillRule="evenodd"
          opacity={opacity}
        />
      )
    }
    case 'line': {
      const dx = shape.target.x - shape.origin.x
      const dy = shape.target.y - shape.origin.y
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
      return (
        <rect
          x={0}
          y={-shape.width / 2}
          width={shape.length}
          height={shape.width}
          fill={color}
          opacity={opacity}
          transform={`translate(${shape.origin.x} ${shape.origin.y}) rotate(${angleDeg})`}
        />
      )
    }
    case 'cone': {
      const dx = shape.target.x - shape.origin.x
      const dy = shape.target.y - shape.origin.y
      const centerAngle = Math.atan2(dy, dx)
      const half = ((shape.angleWidthDeg / 2) * Math.PI) / 180
      const p1 = {
        x: shape.origin.x + shape.radius * Math.cos(centerAngle - half),
        y: shape.origin.y + shape.radius * Math.sin(centerAngle - half),
      }
      const p2 = {
        x: shape.origin.x + shape.radius * Math.cos(centerAngle + half),
        y: shape.origin.y + shape.radius * Math.sin(centerAngle + half),
      }
      const largeArc = shape.angleWidthDeg > 180 ? 1 : 0
      const d = `M ${shape.origin.x} ${shape.origin.y} L ${p1.x} ${p1.y} A ${shape.radius} ${shape.radius} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`
      return <path d={d} fill={color} opacity={opacity} />
    }
  }
}

function describeCircle(center: Vector2, r: number): string {
  return `M ${center.x - r} ${center.y} A ${r} ${r} 0 1 0 ${center.x + r} ${center.y} A ${r} ${r} 0 1 0 ${center.x - r} ${center.y} Z`
}

export function Arena({ arena, bossPos, playerPos, active, timeMs }: ArenaProps) {
  const half = arena.radius + VIEW_MARGIN
  const viewBox = `${arena.center.x - half} ${arena.center.y - half} ${half * 2} ${half * 2}`
  const clipId = 'arena-clip'

  return (
    <svg viewBox={viewBox} className="arena-svg" role="img" aria-label="Fight arena">
      <defs>
        <clipPath id={clipId}>
          <circle cx={arena.center.x} cy={arena.center.y} r={arena.radius} />
        </clipPath>
      </defs>

      <circle
        cx={arena.center.x}
        cy={arena.center.y}
        r={arena.radius}
        className="arena-floor"
      />

      <g clipPath={`url(#${clipId})`}>
        {active.map((mech) => (
          <TelegraphShape key={mech.instanceId} mech={mech} timeMs={timeMs} />
        ))}
      </g>

      <circle
        cx={arena.center.x}
        cy={arena.center.y}
        r={arena.radius}
        className="arena-boundary"
      />

      <g transform={`translate(${bossPos.x} ${bossPos.y})`} className="boss-token">
        <rect x={-1.4} y={-1.4} width={2.8} height={2.8} transform="rotate(45)" />
      </g>

      <g transform={`translate(${playerPos.x} ${playerPos.y})`} className="player-token">
        <circle r={1.1} />
      </g>
    </svg>
  )
}
