import type { UserLevel } from './types'

export interface UserLevelMeta {
  value: UserLevel
  label: string
  description: string
  color: string
}

export const USER_LEVEL_OPTIONS: UserLevelMeta[] = [
  { value: 'new', label: 'New', description: 'Little to no tolerance, lower starting doses recommended', color: '#10b981' },
  { value: 'common', label: 'Common', description: 'Moderate tolerance with regular use', color: '#f59e0b' },
  { value: 'heavy', label: 'Heavy', description: 'Significant tolerance, higher doses may be needed', color: '#ef4444' },
]

export const USER_LEVEL_INFO = Object.fromEntries(
  USER_LEVEL_OPTIONS.map(o => [o.value, { label: o.label, description: o.description, color: o.color }])
) as Record<UserLevel, Omit<UserLevelMeta, 'value'>>
