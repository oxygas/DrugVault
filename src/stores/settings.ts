'use client'

import { create } from 'zustand'
import type { UserLevel } from '@/lib/types'

const STORAGE_KEY = 'tripgem-settings'

interface PersistedData {
  bodyWeight: number
  weightUnit: 'kg' | 'lb'
  userLevel: UserLevel
  onboarded: boolean
}

const DEFAULTS: PersistedData = {
  bodyWeight: 70,
  weightUnit: 'kg',
  userLevel: 'common',
  onboarded: false,
}

function loadFromStorage(): PersistedData {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<PersistedData>
    return {
      bodyWeight: typeof parsed.bodyWeight === 'number' && parsed.bodyWeight > 0 && parsed.bodyWeight <= 500 ? parsed.bodyWeight : 70,
      weightUnit: parsed.weightUnit === 'lb' ? 'lb' : 'kg',
      userLevel: parsed.userLevel === 'new' || parsed.userLevel === 'heavy' ? parsed.userLevel : 'common',
      onboarded: parsed.onboarded === true,
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
  hydrated: boolean
  weightKg: number
  setBodyWeight: (w: number) => void
  setWeightUnit: (u: 'kg' | 'lb') => void
  setUserLevel: (l: UserLevel) => void
  setSettingsOpen: (o: boolean) => void
  toggleSettings: () => void
  setOnboarded: (o: boolean) => void
  hydrate: () => void
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  bodyWeight: DEFAULTS.bodyWeight,
  weightUnit: DEFAULTS.weightUnit,
  userLevel: DEFAULTS.userLevel,
  settingsOpen: false,
  onboarded: false,
  hydrated: false,
  get weightKg() {
    const s = get()
    return s.weightUnit === 'lb' ? s.bodyWeight * 0.453592 : s.bodyWeight
  },
  setBodyWeight: (w) => {
    set({ bodyWeight: w })
    saveToStorage({ bodyWeight: w })
  },
  setWeightUnit: (u) => {
    set({ weightUnit: u })
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
  hydrate: () => {
    if (get().hydrated) return
    const data = loadFromStorage()
    set({
      bodyWeight: data.bodyWeight,
      weightUnit: data.weightUnit,
      userLevel: data.userLevel,
      onboarded: data.onboarded,
      hydrated: true,
    })
  },
}))
