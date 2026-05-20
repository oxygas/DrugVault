export interface CategoryConfig {
  name: string
  color: string
  icon?: string
}

export interface ComboLevelConfig {
  key: string
  label: string
  color: string
  description: string
  order: number
}

export interface HarmLevelConfig {
  key: string
  label: string
  color: string
  order: number
}

export const CATEGORY_REGISTRY: CategoryConfig[] = [
  { name: 'Depressants', color: '#8b5cf6' },
  { name: 'Stimulants', color: '#f97316' },
  { name: 'Opioids', color: '#ef4444' },
  { name: 'Psychedelics', color: '#06b6d4' },
  { name: 'Dissociatives', color: '#a78bfa' },
  { name: 'Entactogens', color: '#ec4899' },
  { name: 'Cannabinoids', color: '#22c55e' },
  { name: 'Inhalants', color: '#eab308' },
  { name: 'Deliriants', color: '#7f1d1d' },
  { name: 'Gabapentionoids', color: '#0d9488' },
  { name: 'Nootropics', color: '#14b8a6' },
  { name: 'Antidepressants', color: '#6366f1' },
  { name: 'Supplements', color: '#84cc16' },
]

export const COMBO_LEVEL_REGISTRY: ComboLevelConfig[] = [
  { key: 'safe', label: 'Safe', color: '#10b981', description: 'Generally safe. Low risk of physical harm or dangerous interactions.', order: 0 },
  { key: 'low_risk', label: 'Low Risk', color: '#06b6d4', description: 'Low risk, but caution is still advised. Monitor effects.', order: 1 },
  { key: 'caution', label: 'Caution', color: '#f59e0b', description: 'Caution advised. Effects may be unpredictable or synergize in uncomfortable ways.', order: 2 },
  { key: 'unsafe', label: 'Unsafe', color: '#f97316', description: 'Unsafe combination. Significant risk of adverse physical or psychological reactions.', order: 3 },
  { key: 'dangerous', label: 'Dangerous', color: '#ef4444', description: 'Dangerous combination. High risk of severe medical emergency, physical harm, or intense psychological distress.', order: 4 },
  { key: 'deadly', label: 'Deadly', color: '#b91c1c', description: 'Potentially deadly combination. Extreme risk of fatal respiratory depression, serotonin syndrome, or cardiac arrest.', order: 5 },
]

export const HARM_LEVEL_REGISTRY: HarmLevelConfig[] = [
  { key: 'low', label: 'Low', color: '#22c55e', order: 0 },
  { key: 'moderate', label: 'Moderate', color: '#eab308', order: 1 },
  { key: 'high', label: 'High', color: '#f97316', order: 2 },
  { key: 'extreme', label: 'Extreme', color: '#ef4444', order: 3 },
]

export function getCategoryColor(name: string): string {
  return CATEGORY_REGISTRY.find(c => c.name === name)?.color ?? '#8b5cf6'
}

export function getCategoryNames(): string[] {
  return CATEGORY_REGISTRY.map(c => c.name)
}

export function getComboLevelConfig(key: string): ComboLevelConfig {
  return COMBO_LEVEL_REGISTRY.find(c => c.key === key) ?? COMBO_LEVEL_REGISTRY[2]
}

export function getHarmLevelConfig(key: string): HarmLevelConfig {
  return HARM_LEVEL_REGISTRY.find(h => h.key === key) ?? HARM_LEVEL_REGISTRY[0]
}

export function addCategory(config: CategoryConfig): void {
  const existing = CATEGORY_REGISTRY.findIndex(c => c.name === config.name)
  if (existing >= 0) CATEGORY_REGISTRY[existing] = config
  else CATEGORY_REGISTRY.push(config)
}

export function addComboLevel(config: ComboLevelConfig): void {
  const existing = COMBO_LEVEL_REGISTRY.findIndex(c => c.key === config.key)
  if (existing >= 0) COMBO_LEVEL_REGISTRY[existing] = config
  else COMBO_LEVEL_REGISTRY.push(config)
  COMBO_LEVEL_REGISTRY.sort((a, b) => a.order - b.order)
}

export function addHarmLevel(config: HarmLevelConfig): void {
  const existing = HARM_LEVEL_REGISTRY.findIndex(h => h.key === config.key)
  if (existing >= 0) HARM_LEVEL_REGISTRY[existing] = config
  else HARM_LEVEL_REGISTRY.push(config)
  HARM_LEVEL_REGISTRY.sort((a, b) => a.order - b.order)
}
