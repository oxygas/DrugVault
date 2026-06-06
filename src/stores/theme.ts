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

function lockScroll(lock: boolean) {
  // Removed to prevent layout shift and VirtuosoGrid breaking
}

interface ThemeState {
  themeId: string
  themeOpen: boolean
  hydrated: boolean
  setTheme: (id: string) => void
  setThemeOpen: (o: boolean) => void
  toggleTheme: () => void
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
  setThemeOpen: (o) => {
    set({ themeOpen: o })
    lockScroll(o)
  },
  toggleTheme: () => set((s) => {
    const next = !s.themeOpen
    lockScroll(next)
    return { themeOpen: next }
  }),
  hydrate: () => {
    if (get().hydrated) return
    const id = loadTheme()
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', id)
    }
    set({ themeId: id, hydrated: true })
  },
}))
