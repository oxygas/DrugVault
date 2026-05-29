import type { Category } from '@/lib/types'

const STORAGE_KEY = 'tripgem-ui-sounds'

let ctx: AudioContext | null = null
let reverbNode: ConvolverNode | null = null
let _enabled = true

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function getReverb(c: AudioContext): ConvolverNode {
  if (reverbNode) return reverbNode
  const len = c.sampleRate * 2
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.4)) * 0.4
    }
  }
  reverbNode = c.createConvolver()
  reverbNode.buffer = buf
  reverbNode.connect(c.destination)
  return reverbNode
}

export function isUIsoundsEnabled(): boolean {
  return _enabled
}

export function setUIsoundsEnabled(on: boolean) {
  _enabled = on
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(on)) } catch {}
}

export function hydrateUIsounds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null) _enabled = JSON.parse(raw)
  } catch {}
}

function rv(c: AudioContext, wet: number): GainNode {
  const s = c.createGain()
  s.gain.value = wet
  s.connect(getReverb(c))
  return s
}

function s(c: AudioContext, type: OscillatorType, freq: number, t: number, dur: number, vol: number, dest: AudioNode, detune = 0) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  if (detune) o.detune.value = detune
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + Math.min(0.01, dur * 0.1))
  g.gain.setValueAtTime(vol * 0.8, t + dur * 0.35)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g)
  g.connect(dest)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function pluck(c: AudioContext, freq: number, t: number, vol: number, dest: AudioNode, wet = 0.3) {
  const r = rv(c, wet)
  r.connect(dest)
  s(c, 'sine', freq, t, 0.25, vol, dest)
  s(c, 'sine', freq, t, 0.25, vol * 0.3, r)
  s(c, 'sine', freq * 2.002, t, 0.15, vol * 0.1, dest)
  s(c, 'triangle', freq * 0.999, t, 0.2, vol * 0.08, r)
}

const CATEGORY_SOUNDS: Record<string, (c: AudioContext, t: number, dest: AudioNode) => void> = {
  Stimulants(c, t, dest) {
    const r = rv(c, 0.25)
    r.connect(dest)
    s(c, 'sine', 784, t, 0.08, 0.1, dest)
    s(c, 'sine', 784, t, 0.1, 0.03, r)
    s(c, 'sine', 1047, t + 0.04, 0.07, 0.08, dest)
    s(c, 'sine', 1047, t + 0.04, 0.08, 0.025, r)
    s(c, 'sine', 1319, t + 0.08, 0.06, 0.07, dest)
    s(c, 'triangle', 1568, t + 0.1, 0.04, 0.04, r)
    s(c, 'sine', 1568, t + 0.1, 0.04, 0.015, dest)
    s(c, 'square', 2093, t + 0.12, 0.025, 0.02, r)
  },

  Depressants(c, t, dest) {
    const r = rv(c, 0.6)
    r.connect(dest)
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 1200
    f.Q.value = 0.7
    f.connect(dest)
    f.connect(r)
    s(c, 'sine', 110, t, 0.5, 0.09, f)
    s(c, 'triangle', 165, t + 0.02, 0.45, 0.05, f)
    s(c, 'sine', 220, t + 0.05, 0.4, 0.06, f)
    s(c, 'sine', 220, t + 0.05, 0.4, 0.025, r)
    s(c, 'sine', 330, t + 0.12, 0.35, 0.03, r)
  },

  Psychedelics(c, t, dest) {
    const r = rv(c, 0.7)
    r.connect(dest)
    s(c, 'sine', 440, t, 0.4, 0.06, dest)
    s(c, 'sine', 440, t, 0.4, 0.04, r)
    s(c, 'sine', 441.5, t, 0.4, 0.04, r)
    s(c, 'sine', 554.37, t + 0.08, 0.35, 0.05, dest)
    s(c, 'sine', 555.5, t + 0.08, 0.35, 0.03, r)
    s(c, 'sine', 660, t + 0.18, 0.3, 0.04, r)
    s(c, 'sine', 880, t + 0.25, 0.25, 0.015, r)
    s(c, 'sine', 880.8, t + 0.26, 0.25, 0.012, r)
    s(c, 'triangle', 330, t, 0.5, 0.03, r)
  },

  Dissociatives(c, t, dest) {
    const r = rv(c, 0.55)
    r.connect(dest)
    const f = c.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.setValueAtTime(800, t)
    f.frequency.exponentialRampToValueAtTime(400, t + 0.3)
    f.Q.value = 5
    f.connect(dest)
    f.connect(r)
    s(c, 'sawtooth', 220, t, 0.35, 0.04, f)
    s(c, 'sawtooth', 219.5, t, 0.35, 0.03, f)
    s(c, 'sine', 146.83, t + 0.05, 0.4, 0.05, f)
    s(c, 'triangle', 293.66, t + 0.1, 0.25, 0.03, r)
    s(c, 'sine', 440, t + 0.2, 0.3, 0.02, r)
  },

  Entactogens(c, t, dest) {
    const r = rv(c, 0.55)
    r.connect(dest)
    pluck(c, 523.25, t, 0.07, dest, 0.4)
    pluck(c, 659.25, t + 0.08, 0.065, dest, 0.4)
    pluck(c, 783.99, t + 0.16, 0.06, dest, 0.5)
    s(c, 'sine', 261.63, t, 0.4, 0.04, r)
    s(c, 'triangle', 261.63, t + 0.02, 0.35, 0.03, r)
  },

  Opioids(c, t, dest) {
    const r = rv(c, 0.7)
    r.connect(dest)
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 600
    f.Q.value = 0.5
    f.connect(dest)
    f.connect(r)
    s(c, 'sine', 82.41, t, 0.8, 0.08, f)
    s(c, 'sine', 123.47, t + 0.1, 0.7, 0.05, f)
    s(c, 'triangle', 164.81, t + 0.2, 0.6, 0.04, f)
    s(c, 'sine', 164.81, t + 0.2, 0.6, 0.025, r)
    s(c, 'sine', 246.94, t + 0.35, 0.5, 0.02, r)
  },

  Cannabinoids(c, t, dest) {
    const r = rv(c, 0.5)
    r.connect(dest)
    s(c, 'sine', 196, t, 0.35, 0.06, dest)
    s(c, 'sine', 196, t, 0.35, 0.035, r)
    s(c, 'triangle', 196.8, t, 0.3, 0.03, r)
    s(c, 'sine', 293.66, t + 0.1, 0.3, 0.05, dest)
    s(c, 'sine', 293.66, t + 0.1, 0.3, 0.03, r)
    s(c, 'sine', 261.63, t + 0.22, 0.25, 0.04, r)
    const lfo = c.createOscillator()
    const lg = c.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = 4
    lg.gain.value = 6
    lfo.connect(lg)
    lfo.start(t)
    lfo.stop(t + 0.4)
    lfo.disconnect()
  },

  Inhalants(c, t, dest) {
    const r = rv(c, 0.3)
    r.connect(dest)
    s(c, 'sawtooth', 587.33, t, 0.06, 0.06, dest)
    s(c, 'sawtooth', 587.33, t, 0.06, 0.03, r)
    s(c, 'square', 1174.66, t, 0.03, 0.02, r)
    s(c, 'sine', 440, t + 0.03, 0.08, 0.04, dest)
    s(c, 'sine', 880, t + 0.05, 0.05, 0.015, r)
  },

  Deliriants(c, t, dest) {
    const r = rv(c, 0.6)
    r.connect(dest)
    s(c, 'sine', 233.08, t, 0.35, 0.05, dest)
    s(c, 'sine', 233.08, t, 0.35, 0.03, r)
    s(c, 'sine', 311.13, t + 0.06, 0.3, 0.04, dest)
    s(c, 'sawtooth', 311.13, t + 0.06, 0.25, 0.015, r)
    s(c, 'sine', 185, t + 0.15, 0.3, 0.035, r)
    s(c, 'triangle', 369.99, t + 0.2, 0.2, 0.02, r)
  },

  Gabapentionoids(c, t, dest) {
    const r = rv(c, 0.5)
    r.connect(dest)
    s(c, 'sine', 261.63, t, 0.3, 0.06, dest)
    s(c, 'sine', 261.63, t, 0.3, 0.03, r)
    s(c, 'sine', 329.63, t + 0.1, 0.25, 0.05, dest)
    s(c, 'triangle', 329.63, t + 0.1, 0.25, 0.025, r)
    s(c, 'sine', 392, t + 0.2, 0.2, 0.04, r)
  },

  Nootropics(c, t, dest) {
    const r = rv(c, 0.35)
    r.connect(dest)
    pluck(c, 880, t, 0.06, dest, 0.3)
    pluck(c, 1174.66, t + 0.05, 0.05, dest, 0.3)
    s(c, 'sine', 1760, t + 0.02, 0.04, 0.01, r)
  },

  Antidepressants(c, t, dest) {
    const r = rv(c, 0.5)
    r.connect(dest)
    s(c, 'sine', 293.66, t, 0.35, 0.06, dest)
    s(c, 'sine', 293.66, t, 0.35, 0.035, r)
    s(c, 'sine', 369.99, t + 0.1, 0.3, 0.055, dest)
    s(c, 'triangle', 369.99, t + 0.1, 0.3, 0.03, r)
    s(c, 'sine', 440, t + 0.22, 0.25, 0.04, r)
    s(c, 'sine', 349.23, t + 0.3, 0.2, 0.025, r)
  },

  Antipsychotics(c, t, dest) {
    const r = rv(c, 0.45)
    r.connect(dest)
    s(c, 'triangle', 220, t, 0.3, 0.05, dest)
    s(c, 'sine', 220, t, 0.3, 0.03, r)
    s(c, 'sine', 277.18, t + 0.08, 0.25, 0.045, dest)
    s(c, 'sine', 277.18, t + 0.08, 0.25, 0.025, r)
    s(c, 'triangle', 329.63, t + 0.18, 0.2, 0.03, r)
  },

  Dopaminergics(c, t, dest) {
    const r = rv(c, 0.35)
    r.connect(dest)
    s(c, 'sine', 659.25, t, 0.1, 0.08, dest)
    s(c, 'sine', 659.25, t, 0.1, 0.03, r)
    s(c, 'sine', 880, t + 0.04, 0.08, 0.07, dest)
    s(c, 'sine', 880, t + 0.04, 0.08, 0.025, r)
    s(c, 'triangle', 1047, t + 0.08, 0.06, 0.05, dest)
    s(c, 'sine', 1319, t + 0.12, 0.04, 0.03, r)
  },

  Supplements(c, t, dest) {
    const r = rv(c, 0.4)
    r.connect(dest)
    pluck(c, 523.25, t, 0.06, dest, 0.35)
    pluck(c, 659.25, t + 0.07, 0.055, dest, 0.35)
  },
}

export function playCategoryClick(category: Category) {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime
  const fn = CATEGORY_SOUNDS[category]
  if (fn) fn(c, t, c.destination)
  else playClick()
}

export function playClick() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime
  pluck(c, 880, t, 0.08, c.destination, 0.3)
}

export function playHover() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime
  const r = rv(c, 0.4)
  r.connect(c.destination)
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(520, t)
  o.frequency.exponentialRampToValueAtTime(780, t + 0.1)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.025, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
  o.connect(g)
  g.connect(c.destination)
  g.connect(r)
  o.start(t)
  o.stop(t + 0.16)
}

export function playOpen() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime
  const r = rv(c, 0.5)
  r.connect(c.destination)
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(400, t)
  f.frequency.exponentialRampToValueAtTime(5000, t + 0.25)
  f.Q.value = 1.5
  f.connect(c.destination)
  f.connect(r)
  s(c, 'sine', 220, t, 0.35, 0.07, f)
  s(c, 'triangle', 330, t + 0.03, 0.3, 0.04, f)
  s(c, 'sine', 440, t + 0.1, 0.25, 0.03, r)
  s(c, 'sine', 554.37, t + 0.15, 0.2, 0.02, r)
}

export function playClose() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime
  const r = rv(c, 0.5)
  r.connect(c.destination)
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(4000, t)
  f.frequency.exponentialRampToValueAtTime(300, t + 0.3)
  f.Q.value = 1.5
  f.connect(c.destination)
  f.connect(r)
  s(c, 'sine', 440, t, 0.3, 0.07, f)
  s(c, 'triangle', 330, t, 0.25, 0.035, f)
  s(c, 'sine', 220, t + 0.1, 0.25, 0.03, r)
}

export function playToggle() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime
  pluck(c, 523.25, t, 0.06, c.destination, 0.4)
  pluck(c, 659.25, t + 0.07, 0.055, c.destination, 0.4)
}

export function playTab() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime
  const r = rv(c, 0.35)
  r.connect(c.destination)
  s(c, 'sine', 784, t, 0.12, 0.05, c.destination)
  s(c, 'sine', 784, t, 0.12, 0.02, r)
  s(c, 'sine', 1047, t + 0.02, 0.08, 0.012, r)
}

export function playFavorite() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime
  const r = rv(c, 0.6)
  r.connect(c.destination)
  const notes = [
    { f: 659.25, d: 0, dur: 0.3, v: 0.06 },
    { f: 783.99, d: 0.06, dur: 0.3, v: 0.055 },
    { f: 987.77, d: 0.12, dur: 0.35, v: 0.05 },
    { f: 1318.5, d: 0.2, dur: 0.5, v: 0.04 },
  ]
  notes.forEach(({ f: freq, d, dur, v }) => {
    s(c, 'sine', freq, t + d, dur, v, c.destination)
    s(c, 'sine', freq, t + d, dur, v * 0.35, r)
    s(c, 'sine', freq * 2.002, t + d, dur * 0.6, v * 0.07, r)
    s(c, 'triangle', freq * 0.5, t + d, dur * 1.3, v * 0.04, r)
  })
}

type PopupTab = 'overview' | 'effects' | 'risks' | 'dosage' | 'tolerance' | 'interactions' | 'legal'

const TAB_SOUNDS: Record<PopupTab, (c: AudioContext, t: number, dest: AudioNode) => void> = {
  overview(c, t, dest) {
    const r = rv(c, 0.4)
    r.connect(dest)
    s(c, 'sine', 523.25, t, 0.2, 0.06, dest)
    s(c, 'sine', 523.25, t, 0.2, 0.025, r)
    s(c, 'triangle', 783.99, t + 0.04, 0.15, 0.04, dest)
    s(c, 'sine', 392, t + 0.08, 0.2, 0.02, r)
  },
  effects(c, t, dest) {
    const r = rv(c, 0.55)
    r.connect(dest)
    s(c, 'sine', 440, t, 0.2, 0.05, dest)
    s(c, 'sine', 440.7, t, 0.2, 0.03, r)
    s(c, 'sine', 554.37, t + 0.05, 0.18, 0.045, dest)
    s(c, 'sine', 554.9, t + 0.05, 0.18, 0.025, r)
    s(c, 'triangle', 659.25, t + 0.1, 0.15, 0.035, r)
  },
  risks(c, t, dest) {
    const r = rv(c, 0.45)
    r.connect(dest)
    s(c, 'triangle', 293.66, t, 0.2, 0.06, dest)
    s(c, 'sine', 293.66, t, 0.2, 0.03, r)
    s(c, 'sawtooth', 220, t, 0.12, 0.015, r)
    s(c, 'sine', 369.99, t + 0.07, 0.18, 0.045, dest)
    s(c, 'triangle', 261.63, t + 0.14, 0.15, 0.025, r)
  },
  dosage(c, t, dest) {
    const r = rv(c, 0.35)
    r.connect(dest)
    pluck(c, 659.25, t, 0.05, dest, 0.3)
    pluck(c, 783.99, t + 0.04, 0.045, dest, 0.3)
  },
  tolerance(c, t, dest) {
    const r = rv(c, 0.45)
    r.connect(dest)
    s(c, 'sine', 349.23, t, 0.25, 0.055, dest)
    s(c, 'sine', 349.23, t, 0.25, 0.03, r)
    s(c, 'sine', 440, t + 0.08, 0.2, 0.045, dest)
    s(c, 'triangle', 440, t + 0.08, 0.2, 0.025, r)
  },
  interactions(c, t, dest) {
    const r = rv(c, 0.4)
    r.connect(dest)
    s(c, 'sine', 392, t, 0.18, 0.06, dest)
    s(c, 'sine', 392, t, 0.18, 0.025, r)
    s(c, 'sine', 523.25, t + 0.05, 0.15, 0.05, dest)
    s(c, 'sine', 523.25, t + 0.05, 0.15, 0.02, r)
    s(c, 'triangle', 329.63, t + 0.1, 0.12, 0.02, r)
  },
  legal(c, t, dest) {
    const r = rv(c, 0.35)
    r.connect(dest)
    s(c, 'triangle', 440, t, 0.15, 0.05, dest)
    s(c, 'sine', 440, t, 0.15, 0.02, r)
    s(c, 'sine', 523.25, t + 0.05, 0.12, 0.04, dest)
    s(c, 'triangle', 523.25, t + 0.05, 0.12, 0.015, r)
  },
}

export function playPopupTab(tab: string) {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime
  const fn = TAB_SOUNDS[tab as PopupTab]
  if (fn) fn(c, t, c.destination)
  else playTab()
}

export function playSearch() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime
  pluck(c, 440, t, 0.045, c.destination, 0.4)
  pluck(c, 554.37, t + 0.06, 0.04, c.destination, 0.4)
  pluck(c, 659.25, t + 0.12, 0.04, c.destination, 0.5)
}

export function playSectionChange() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime
  const r = rv(c, 0.5)
  r.connect(c.destination)
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(300, t)
  f.frequency.exponentialRampToValueAtTime(4000, t + 0.12)
  f.frequency.exponentialRampToValueAtTime(1200, t + 0.35)
  f.Q.value = 2
  f.connect(c.destination)
  f.connect(r)
  s(c, 'sine', 130.81, t, 0.35, 0.06, f)
  s(c, 'triangle', 196, t + 0.03, 0.3, 0.035, f)
  s(c, 'sine', 523.25, t + 0.1, 0.3, 0.025, r)
  s(c, 'sine', 659.25, t + 0.14, 0.25, 0.02, r)
}
