'use client'

import { create } from 'zustand'
import { STORAGE_KEY, DEFAULT_THEME, type ThemeDefinition } from '@/themes/config'

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
  setTheme: (id: string) => void
  setThemeOpen: (o: boolean) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()((set) => ({
  themeId: loadTheme(),
  themeOpen: false,
  setTheme: (id) => {
    set({ themeId: id })
    saveTheme(id)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', id)
    }
  },
  setThemeOpen: (o) => set({ themeOpen: o }),
  toggleTheme: () => set((s) => ({ themeOpen: !s.themeOpen })),
}))
