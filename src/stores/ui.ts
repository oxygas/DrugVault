import { create } from 'zustand'

export type ScoreKey = 'harmScore' | 'addictionScore' | 'odRisk' | 'withdrawalSeverity' | 'interactionDanger' | 'dependenceLiability'

interface ScoreBreakdownState {
  isOpen: boolean
  substanceName: string | null
  scoreKey: ScoreKey | null
}

interface UIState {
  sidebarOpen: boolean
  safetyOverlayDismissed: Record<string, boolean>
  activeSection: string
  scoreBreakdown: ScoreBreakdownState
  pianoOpen: boolean
  setSidebarOpen: (open: boolean) => void
  dismissSafetyOverlay: (id: string) => void
  setActiveSection: (section: string) => void
  openScoreBreakdown: (substanceName: string, scoreKey: ScoreKey) => void
  closeScoreBreakdown: () => void
  setPianoOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  safetyOverlayDismissed: {},
  activeSection: 'substances',
  pianoOpen: false,
  scoreBreakdown: {
    isOpen: false,
    substanceName: null,
    scoreKey: null,
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  dismissSafetyOverlay: (id) =>
    set((s) => ({
      safetyOverlayDismissed: { ...s.safetyOverlayDismissed, [id]: true },
    })),
  setActiveSection: (section) => set({ activeSection: section }),
  openScoreBreakdown: (substanceName, scoreKey) =>
    set({ scoreBreakdown: { isOpen: true, substanceName, scoreKey } }),
  closeScoreBreakdown: () =>
    set({ scoreBreakdown: { isOpen: false, substanceName: null, scoreKey: null } }),
  setPianoOpen: (open) => set({ pianoOpen: open }),
}))
