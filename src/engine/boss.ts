import type { MechanicTemplate } from './mechanics'
import type { Encounter } from './simulation'

/**
 * A fight's fixed content: its arena/player/boss setup and the pool of
 * mechanics it can throw at you. Keeping this per-boss means each fight's
 * mechanics stay scoped to that fight instead of sharing one global list.
 */
export interface BossDefinition {
  id: string
  meta: Omit<Encounter, 'timeline'>
  mechanics: MechanicTemplate[]
}
