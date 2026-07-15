import type { MechanicTemplate } from '../engine/mechanics'

interface MechanicSelectorProps {
  mechanics: MechanicTemplate[]
  enabled: Record<string, boolean>
  onToggle: (id: string) => void
  randomize: boolean
  onRandomizeChange: (value: boolean) => void
}

export function MechanicSelector({
  mechanics,
  enabled,
  onToggle,
  randomize,
  onRandomizeChange,
}: MechanicSelectorProps) {
  return (
    <div className="mechanic-selector">
      <h2>Mechanics</h2>
      <ul>
        {mechanics.map((m) => (
          <li key={m.id}>
            <label>
              <input type="checkbox" checked={enabled[m.id] ?? true} onChange={() => onToggle(m.id)} />
              <span className="mechanic-name">{m.name}</span>
              <span className="mechanic-instruction">{m.instruction}</span>
            </label>
          </li>
        ))}
      </ul>
      <label className="randomize-toggle">
        <input
          type="checkbox"
          checked={randomize}
          onChange={(e) => onRandomizeChange(e.target.checked)}
        />
        Randomize order
      </label>
    </div>
  )
}
