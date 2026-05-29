export interface ThemeDefinition {
  id: string
  name: string
  description: string
  preview: string[]
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'plasma',
    name: 'Plasma',
    description: 'Vibrant purple, violet-magenta neon',
    preview: ['#0a0418', '#c084fc', '#8b5cf6', '#4c1d95', '#22d3ee'],
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    description: 'Classic outrun — hot pink, cyan, amber sun',
    preview: ['#0d0221', '#ff6ec7', '#00ffff', '#ffd700', '#ff1493'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep indigo-blue, cool cyan glow',
    preview: ['#0a0a1a', '#6366f1', '#818cf8', '#06b6d4', '#1e1b4b'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm coral, orange, and purple',
    preview: ['#1a0a0a', '#ff6b6b', '#ff8e53', '#a18cd1', '#fda085'],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Teal, emerald, and purple dreamscape',
    preview: ['#0a1a1a', '#06b6d4', '#10b981', '#8b5cf6', '#14b8a6'],
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Green phosphor on absolute black',
    preview: ['#000000', '#00ff41', '#00cc33', '#003300', '#00ff88'],
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'Classic retro — pink, aqua, purple',
    preview: ['#0a0020', '#ff71ce', '#01cdfe', '#b967ff', '#ffffff'],
  },
  {
    id: 'royal',
    name: 'Royal',
    description: 'Deep purple and amber gold',
    preview: ['#0c0818', '#a855f7', '#fbbf24', '#7c3aed', '#f59e0b'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blue, teal, cyan glow',
    preview: ['#050a14', '#0284c7', '#06b6d4', '#0c4a6e', '#14b8a6'],
  },
  {
    id: 'blood',
    name: 'Blood',
    description: 'Deep red, crimson, dark intensity',
    preview: ['#0a0505', '#ef4444', '#dc2626', '#7f1d1d', '#fbbf24'],
  },
]

export const DEFAULT_THEME = 'plasma'
export const STORAGE_KEY = 'tripgem-theme'

export function getTheme(id: string): ThemeDefinition {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}
