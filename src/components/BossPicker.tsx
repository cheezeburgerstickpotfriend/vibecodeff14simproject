import type { BossDefinition } from '../engine/boss'

interface BossPickerProps {
  bosses: BossDefinition[]
  selectedId: string
  onSelect: (id: string) => void
}

export function BossPicker({ bosses, selectedId, onSelect }: BossPickerProps) {
  return (
    <div className="boss-picker">
      <h2>Fight</h2>
      <div className="boss-picker-list">
        {bosses.map((boss) => (
          <button
            key={boss.id}
            type="button"
            className={`boss-picker-item${boss.id === selectedId ? ' selected' : ''}`}
            onClick={() => onSelect(boss.id)}
          >
            {boss.meta.name}
          </button>
        ))}
      </div>
    </div>
  )
}
