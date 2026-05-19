interface ShortcutGroup {
  title: string
  shortcuts: { keys: string[]; label: string; description?: string }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Alt', '1'], label: 'Substances', description: 'Switch to browse section' },
      { keys: ['Alt', '2'], label: 'Matrix', description: 'Switch to combination matrix' },
      { keys: ['Alt', '3'], label: 'Tools', description: 'Switch to interaction checker' },
    ],
  },
  {
    title: 'Search',
    shortcuts: [
      { keys: ['/'], label: 'Focus search', description: 'Jump to search bar' },
      { keys: ['Ctrl', 'K'], label: 'Quick search', description: 'Open search (Cmd+K on Mac)' },
    ],
  },
  {
    title: 'Popup / Modal',
    shortcuts: [
      { keys: ['Esc'], label: 'Close popup', description: 'Close substance detail or this panel' },
      { keys: ['?'], label: 'This panel', description: 'Toggle keyboard shortcuts help' },
    ],
  },
  {
    title: 'Interaction Checker',
    shortcuts: [
      { keys: ['Tab'], label: 'Next substance', description: 'Move to next selected substance' },
    ],
  },
]

export const SHORTCUT_KEYS = '?'