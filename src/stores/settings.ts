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

function loadFromStorage(): PersistedData {
  if (typeof window === 'undefined') {
    return { bodyWeight: 70, weightUnit: 'kg', userLevel: 'common', onboarded: false }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { bodyWeight: 70, weightUnit: 'kg', userLevel: 'common', onboarded: false }
    const parsed = JSON.parse(raw) as Partial<PersistedData>
    return {
      bodyWeight: typeof parsed.bodyWeight === 'number' && parsed.bodyWeight > 0 && parsed.bodyWeight <= 500 ? parsed.bodyWeight : 70,
      weightUnit: parsed.weightUnit === 'lb' ? 'lb' : 'kg',
      userLevel: parsed.userLevel === 'new' || parsed.userLevel === 'heavy' ? parsed.userLevel : 'common',
      onboarded: parsed.onboarded === true,
    }
  } catch {
    return { bodyWeight: 70, weightUnit: 'kg', userLevel: 'common', onboarded: false }
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
  weightKg: number
  setBodyWeight: (w: number) => void
  setWeightUnit: (u: 'kg' | 'lb') => void
  setUserLevel: (l: UserLevel) => void
  setSettingsOpen: (o: boolean) => void
  toggleSettings: () => void
  setOnboarded: (o: boolean) => void
}

const initial = loadFromStorage()

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  bodyWeight: initial.bodyWeight,
  weightUnit: initial.weightUnit,
  userLevel: initial.userLevel,
  settingsOpen: false,
  onboarded: initial.onboarded,
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
}))
