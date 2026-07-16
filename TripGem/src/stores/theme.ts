'use client'

import { create } from 'zustand'
import { STORAGE_KEY, DEFAULT_THEME, THEMES, type ThemeDefinition } from '@/themes/config'

function loadTheme(): string {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function saveTheme(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {}
}

interface ThemeState {
  themeId: string
  themeOpen: boolean
  hydrated: boolean
  setTheme: (id: string) => void
  setThemeOpen: (o: boolean) => void
  toggleTheme: () => void
  randomTheme: () => void
  hydrate: () => void
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  themeId: DEFAULT_THEME,
  themeOpen: false,
  hydrated: false,
  setTheme: (id) => {
    set({ themeId: id })
    saveTheme(id)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', id)
    }
  },
  setThemeOpen: (o) => set({ themeOpen: o }),
  toggleTheme: () => set((s) => ({ themeOpen: !s.themeOpen })),
  randomTheme: () => {
    const current = get().themeId
    const others = THEMES.filter(t => t.id !== current)
    const pick = others[Math.floor(Math.random() * others.length)]
    get().setTheme(pick.id)
  },
  hydrate: () => {
    if (get().hydrated) return
    const id = loadTheme()
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', id)
    }
    set({ themeId: id, hydrated: true })
  },
}))
