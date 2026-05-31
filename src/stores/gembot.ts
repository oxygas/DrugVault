import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const MAX_MESSAGES = 20

let msgCounter = 0
function generateId(): string {
  msgCounter++
  return `gem-${Date.now()}-${msgCounter}`
}

interface GemBotState {
  isOpen: boolean
  messages: Message[]
}

interface GemBotActions {
  toggle: () => void
  open: () => void
  close: () => void
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void
  appendToLastBotMessage: (chunk: string) => void
  clearHistory: () => void
}

export type GemBotStore = GemBotState & GemBotActions

export const useGemBotStore = create<GemBotStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      messages: [],

      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      addMessage: (msg) =>
        set((s) => {
          const newMsg: Message = {
            ...msg,
            id: generateId(),
            timestamp: Date.now(),
          }
          const messages = [...s.messages, newMsg]
          if (messages.length > MAX_MESSAGES) {
            return { messages: messages.slice(messages.length - MAX_MESSAGES) }
          }
          return { messages }
        }),

      appendToLastBotMessage: (chunk) =>
        set((s) => {
          const last = s.messages.at(-1)
          if (!last || last.role !== 'assistant') return s
          const updated = { ...last, content: last.content + chunk }
          return { messages: [...s.messages.slice(0, -1), updated] }
        }),

      clearHistory: () => set({ messages: [] }),
    }),
    {
      name: 'tripgem_gembot_v3',
      partialize: () => ({}),
    }
  )
)
