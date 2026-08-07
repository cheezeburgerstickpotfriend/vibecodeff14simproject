import type { ActiveMechanic } from '../engine/mechanics'

interface HudProps {
  hp: number
  maxHp: number
  timeMs: number
  active: ActiveMechanic[]
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function Hud({ hp, maxHp, timeMs, active }: HudProps) {
  const hpPct = Math.max(0, (hp / maxHp) * 100)

  return (
    <div className="hud">
      <div className="hud-row">
        <span className="hud-label">HP</span>
        <div className="hp-bar">
          <div className="hp-bar-fill" style={{ width: `${hpPct}%` }} />
          <span className="hp-bar-text">
            {hp} / {maxHp}
          </span>
        </div>
        <span className="hud-timer">{formatTime(timeMs)}</span>
      </div>

      <div className="callouts">
        {active.length === 0 && <div className="callout callout-idle">No mechanics incoming</div>}
        {active.map((mech) => {
          const remainingMs = Math.max(0, mech.resolveMs - timeMs)
          return (
            <div
              key={mech.instanceId}
              className={`callout callout-${mech.template.mode}${mech.template.lethal ? ' callout-lethal' : ''}`}
            >
              <strong>{mech.template.name}</strong>
              {mech.template.lethal && <span className="lethal-tag">INSTANT DEATH</span>} —{' '}
              {mech.template.instruction}
              <span className="callout-timer">{(remainingMs / 1000).toFixed(1)}s</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
