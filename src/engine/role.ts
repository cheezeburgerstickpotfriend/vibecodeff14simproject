/** The classic FFXIV trinity. Mechanics can be tagged with which role(s) they're relevant to. */
export type Role = 'tank' | 'healer' | 'dps'

export const ALL_ROLES: Role[] = ['tank', 'healer', 'dps']

export const ROLE_LABELS: Record<Role, string> = {
  tank: 'Tank',
  healer: 'Healer',
  dps: 'DPS',
}
