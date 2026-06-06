import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface JournalEntry {
  id: string
  substance: string
  date: string
  dose?: string
  roa?: string
  setting?: string
  mood?: number
  notes: string
  createdAt: string
}

interface JournalState {
  entries: JournalEntry[]
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void
  deleteEntry: (id: string) => void
  exportJson: () => string
  importJson: (json: string) => boolean
}

let idCounter = Date.now()
const uid = () => `entry_${++idCounter}`

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry) =>
        set((s) => ({
          entries: [
            { ...entry, id: uid(), createdAt: new Date().toISOString() },
            ...s.entries,
          ],
        })),
      deleteEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      exportJson: () => JSON.stringify(get().entries, null, 2),
      importJson: (json) => {
        try {
          const data = JSON.parse(json)
          if (!Array.isArray(data)) return false
          set({ entries: data })
          return true
        } catch {
          return false
        }
      },
    }),
    { name: 'tripgem_journal' }
  )
)
