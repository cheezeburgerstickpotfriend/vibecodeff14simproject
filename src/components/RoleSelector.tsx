import { ALL_ROLES, ROLE_LABELS, type Role } from '../engine/role'

interface RoleSelectorProps {
  selected: Role
  onSelect: (role: Role) => void
}

export function RoleSelector({ selected, onSelect }: RoleSelectorProps) {
  return (
    <div className="role-picker">
      <h2>Role</h2>
      <div className="role-picker-list">
        {ALL_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            className={`role-picker-item${role === selected ? ' selected' : ''}`}
            onClick={() => onSelect(role)}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>
    </div>
  )
}
