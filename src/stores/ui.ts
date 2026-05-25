import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  safetyOverlayDismissed: Record<string, boolean>
  activeSection: string
  setSidebarOpen: (open: boolean) => void
  dismissSafetyOverlay: (id: string) => void
  setActiveSection: (section: string) => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  safetyOverlayDismissed: {},
  activeSection: 'substances',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  dismissSafetyOverlay: (id) =>
    set((s) => ({
      safetyOverlayDismissed: { ...s.safetyOverlayDismissed, [id]: true },
    })),
  setActiveSection: (section) => set({ activeSection: section }),
}))
