'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserLevel } from '@/lib/types'

interface SettingsState {
  bodyWeight: number
  weightUnit: 'kg' | 'lb'
  userLevel: UserLevel
  settingsOpen: boolean
  onboarded: boolean
  setBodyWeight: (w: number) => void
  setWeightUnit: (u: 'kg' | 'lb') => void
  setUserLevel: (l: UserLevel) => void
  setSettingsOpen: (o: boolean) => void
  toggleSettings: () => void
  setOnboarded: (o: boolean) => void
  weightKg: number
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      bodyWeight: 70,
      weightUnit: 'kg',
      userLevel: 'common',
      settingsOpen: false,
      onboarded: false,
      setBodyWeight: (w) => set({ bodyWeight: w }),
      setWeightUnit: (u) => set({ weightUnit: u }),
      setUserLevel: (l) => set({ userLevel: l }),
      setSettingsOpen: (o) => set({ settingsOpen: o }),
      toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
      setOnboarded: (o) => set({ onboarded: o }),
      get weightKg() {
        const s = get()
        return s.weightUnit === 'lb' ? s.bodyWeight * 0.453592 : s.bodyWeight
      },
    }),
    {
      name: 'tripgem-settings',
      partialize: (state) => ({
        bodyWeight: state.bodyWeight,
        weightUnit: state.weightUnit,
        userLevel: state.userLevel,
        onboarded: state.onboarded,
      }),
    },
  ),
)
