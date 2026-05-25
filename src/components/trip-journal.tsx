'use client'

import { useState } from 'react'
import { useJournalStore, type JournalEntry } from '@/stores/journal'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Trash2, Download, Upload, Star,
  Syringe, MapPin, Smile, Frown, Meh,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const MOOD_ICONS: Record<number, React.ReactNode> = {
  1: <Frown className="h-4 w-4 text-red-400" />,
  2: <Frown className="h-4 w-4 text-orange-400" />,
  3: <Meh className="h-4 w-4 text-amber-400" />,
  4: <Smile className="h-4 w-4 text-lime-400" />,
  5: <Star className="h-4 w-4 text-green-400 fill-green-400" />,
}

const SUBSTANCE_LIST = [
  'MDMA', 'LSD', 'Ketamine', 'Cannabis', 'Psilocybin', 'DMT',
  'Cocaine', 'Amphetamine', '2C-B', 'Mescaline', 'Alcohol', 'Nitrous Oxide',
]

const ROA_OPTIONS = ['Oral', 'Insufflated', 'Sublingual', 'Rectal', 'Intramuscular', 'Intravenous', 'Inhalation', 'Topical', 'Intranasal']

function EntryCard({ entry }: { entry: JournalEntry }) {
  const deleteEntry = useJournalStore((s) => s.deleteEntry)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
    >
      <Card className="p-3 bg-zinc-900/50 border-zinc-800 relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1.5 right-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
          onClick={() => { deleteEntry(entry.id); toast.success('Entry deleted') }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>

        <div className="flex items-start gap-2.5">
          <span className="text-base leading-none mt-0.5">📝</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-zinc-200">{entry.substance}</span>
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-zinc-700 text-zinc-400">
                {new Date(entry.date).toLocaleDateString()}
              </Badge>
              {entry.mood && MOOD_ICONS[entry.mood]}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-zinc-500">
              {entry.roa && (
                <span className="flex items-center gap-1">
                  <Syringe className="h-2.5 w-2.5" />
                  {entry.roa}
                </span>
              )}
              {entry.dose && <span>{entry.dose}</span>}
              {entry.setting && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  {entry.setting}
                </span>
              )}
            </div>

            {entry.notes && (
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {entry.notes}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function TripJournal() {
  const { entries, addEntry, exportJson, importJson } = useJournalStore()
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    substance: '',
    date: new Date().toISOString().split('T')[0],
    dose: '',
    roa: '',
    setting: '',
    mood: 3,
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.substance) return toast.error('Select a substance')
    addEntry({
      substance: form.substance,
      date: form.date,
      dose: form.dose || undefined,
      roa: form.roa || undefined,
      setting: form.setting || undefined,
      mood: form.mood,
      notes: form.notes,
    })
    setForm((prev) => ({
      ...prev,
      substance: '',
      dose: '',
      roa: '',
      setting: '',
      mood: 3,
      notes: '',
    }))
    setShowForm(false)
    toast.success('Entry saved to local journal')
  }

  const handleExport = () => {
    const json = exportJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `tripgem-journal-${new Date().toISOString().split('T')[0]}.json`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Journal exported')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      if (importJson(text)) {
        toast.success(`Imported ${JSON.parse(text).length} entries`)
      } else {
        toast.error('Invalid journal file')
      }
    }
    input.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3 w-3" />
          New Entry
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExport}>
          <Download className="h-3 w-3" />
          Export
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleImport}>
          <Upload className="h-3 w-3" />
          Import
        </Button>
        <span className="text-xs text-zinc-600 ml-auto">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-4 bg-zinc-900/50 border-zinc-800">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1 block">Substance *</label>
                    <select
                      value={form.substance}
                      onChange={(e) => setForm({ ...form, substance: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      required
                    >
                      <option value="">Select...</option>
                      {SUBSTANCE_LIST.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1 block">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1 block">Dose</label>
                    <input
                      type="text"
                      value={form.dose}
                      onChange={(e) => setForm({ ...form, dose: e.target.value })}
                      placeholder="e.g. 100mg"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1 block">Route</label>
                    <select
                      value={form.roa}
                      onChange={(e) => setForm({ ...form, roa: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="">Select...</option>
                      {ROA_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Setting</label>
                  <input
                    type="text"
                    value={form.setting}
                    onChange={(e) => setForm({ ...form, setting: e.target.value })}
                    placeholder="e.g. Home with friends, Nature, Festival"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">
                    Mood Rating: {form.mood}/5
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({ ...form, mood: n })}
                        className={cn(
                          'p-2 rounded-lg border transition-all',
                          form.mood === n
                            ? 'border-purple-500/50 bg-purple-950/30'
                            : 'border-zinc-700 hover:border-zinc-500'
                        )}
                      >
                        {MOOD_ICONS[n]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="How was the experience? Any insights?"
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={!form.substance}>
                    Save Entry
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <BookOpen className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-600">No journal entries yet. Start documenting your experiences privately.</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
