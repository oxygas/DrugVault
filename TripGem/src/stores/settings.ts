'use client'

import { create } from 'zustand'
import type { UserLevel } from '@/lib/types'

const STORAGE_KEY = 'tripgem-settings'

interface PersistedData {
  bodyWeight: number
  weightUnit: 'kg' | 'lb'
  userLevel: UserLevel
  onboarded: boolean
  uiSounds: boolean
  loFiMode: boolean
}

const DEFAULTS: PersistedData = {
  bodyWeight: 70,
  weightUnit: 'kg',
  userLevel: 'common',
  onboarded: false,
  uiSounds: true,
  loFiMode: true,
}

function loadFromStorage(): PersistedData {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // No saved preference — default to Solid State ON
      return { ...DEFAULTS }
    }
    const parsed = JSON.parse(raw) as Partial<PersistedData>
    return {
      bodyWeight: typeof parsed.bodyWeight === 'number' && parsed.bodyWeight > 0 && parsed.bodyWeight <= 500 ? parsed.bodyWeight : 70,
      weightUnit: parsed.weightUnit === 'lb' ? 'lb' : 'kg',
      userLevel: parsed.userLevel === 'new' || parsed.userLevel === 'heavy' ? parsed.userLevel : 'common',
      onboarded: parsed.onboarded === true,
      uiSounds: parsed.uiSounds !== false,
      // Default ON; only OFF if user explicitly saved false
      loFiMode: parsed.loFiMode === false ? false : true,
    }
  } catch {
    return DEFAULTS
  }
}

function saveToStorage(data: Partial<PersistedData>) {
  try {
    const current = loadFromStorage()
    const merged = { ...current, ...data }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {}
}

interface SettingsState {
  bodyWeight: number
  weightUnit: 'kg' | 'lb'
  userLevel: UserLevel
  settingsOpen: boolean
  onboarded: boolean
  uiSounds: boolean
  loFiMode: boolean
  hydrated: boolean
  weightKg: number
  setBodyWeight: (w: number) => void
  setWeightUnit: (u: 'kg' | 'lb') => void
  setUserLevel: (l: UserLevel) => void
  setSettingsOpen: (o: boolean) => void
  toggleSettings: () => void
  setOnboarded: (o: boolean) => void
  setUISounds: (on: boolean) => void
  setLoFiMode: (on: boolean) => void
  hydrate: () => void
}

function computeKg(bodyWeight: number, weightUnit: 'kg' | 'lb'): number {
  return weightUnit === 'lb' ? bodyWeight * 0.453592 : bodyWeight
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  bodyWeight: DEFAULTS.bodyWeight,
  weightUnit: DEFAULTS.weightUnit,
  userLevel: DEFAULTS.userLevel,
  settingsOpen: false,
  onboarded: false,
  uiSounds: DEFAULTS.uiSounds,
  loFiMode: DEFAULTS.loFiMode,
  hydrated: false,
  weightKg: computeKg(DEFAULTS.bodyWeight, DEFAULTS.weightUnit),
  setBodyWeight: (w) => {
    set((s) => ({ bodyWeight: w, weightKg: computeKg(w, s.weightUnit) }))
    saveToStorage({ bodyWeight: w })
  },
  setWeightUnit: (u) => {
    set((s) => ({ weightUnit: u, weightKg: computeKg(s.bodyWeight, u) }))
    saveToStorage({ weightUnit: u })
  },
  setUserLevel: (l) => {
    set({ userLevel: l })
    saveToStorage({ userLevel: l })
  },
  setSettingsOpen: (o) => set({ settingsOpen: o }),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  setOnboarded: (o) => {
    set({ onboarded: o })
    saveToStorage({ onboarded: o })
  },
  setUISounds: (on) => {
    set({ uiSounds: on })
    saveToStorage({ uiSounds: on })
  },
  setLoFiMode: (on) => {
    set({ loFiMode: on })
    saveToStorage({ loFiMode: on })
    if (typeof document !== 'undefined') {
      if (on) {
        document.documentElement.classList.add('lo-fi-mode')
      } else {
        document.documentElement.classList.remove('lo-fi-mode')
      }
    }
  },
  hydrate: () => {
    if (get().hydrated) return
    const data = loadFromStorage()
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('lo-fi-mode', data.loFiMode)
    }
    set({
      bodyWeight: data.bodyWeight,
      weightUnit: data.weightUnit,
      weightKg: computeKg(data.bodyWeight, data.weightUnit),
      userLevel: data.userLevel,
      onboarded: data.onboarded,
      uiSounds: data.uiSounds,
      loFiMode: data.loFiMode,
      hydrated: true,
    })
  },
}))
