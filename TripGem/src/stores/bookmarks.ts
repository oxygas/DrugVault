import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BookmarkState {
  bookmarks: string[]
  toggle: (slug: string) => void
  isBookmarked: (slug: string) => boolean
  clear: () => void
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      toggle: (slug) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(slug)
            ? s.bookmarks.filter((b) => b !== slug)
            : [...s.bookmarks, slug],
        })),
      isBookmarked: (slug) => get().bookmarks.includes(slug),
      clear: () => set({ bookmarks: [] }),
    }),
    { name: 'tripgem_bookmarks' }
  )
)
