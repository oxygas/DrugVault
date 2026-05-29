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
  if (typeof document === 'undefined') return
  if (lock) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

interface ThemeState {
  themeId: string
  themeOpen: boolean
  setTheme: (id: string) => void
  setThemeOpen: (o: boolean) => void
  toggleTheme: () => void
}

function initThemeAttribute(): string {
  const id = loadTheme()
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', id)
  }
  return id
}

export const useThemeStore = create<ThemeState>()((set) => ({
  themeId: initThemeAttribute(),
  themeOpen: false,
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
}))
