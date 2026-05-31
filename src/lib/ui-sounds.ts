import type { Category } from '@/lib/types'

const STORAGE_KEY = 'tripgem-ui-sounds'

let ctx: AudioContext | null = null
let _enabled = true

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function makeLofiReverb(c: AudioContext): ConvolverNode {
  const len = c.sampleRate * 1.0
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      const env = Math.exp(-i / (c.sampleRate * 0.25))
      d[i] = (Math.random() * 2 - 1) * env
    }
  }
  const n = c.createConvolver()
  n.buffer = buf
  return n
}

let _reverbBus: { node: GainNode; rev: ConvolverNode } | null = null
function getReverbBus(c: AudioContext): { node: GainNode; rev: ConvolverNode } {
  if (_reverbBus) return _reverbBus
  const rev = makeLofiReverb(c)
  const node = c.createGain()
  node.gain.value = 0.15
  node.connect(rev)
  rev.connect(c.destination)
  _reverbBus = { node, rev }
  return _reverbBus
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

function chime(
  c: AudioContext,
  freq: number,
  t: number,
  dur: number,
  vol: number,
  dest: AudioNode,
  rev?: AudioNode
) {
  const attack = 0.005
  const decay = dur * 0.9

  const osc1 = c.createOscillator()
  const osc2 = c.createOscillator()
  osc1.type = 'sine'
  osc2.type = 'sine'

  osc1.frequency.value = freq
  osc2.frequency.value = freq * 2.0

  osc1.detune.value = 3
  osc2.detune.value = -2

  const g1 = c.createGain()
  const g2 = c.createGain()
  const master = c.createGain()
  const filter = c.createBiquadFilter()

  filter.type = 'lowpass'
  filter.frequency.value = 4000
  filter.Q.value = 0.3

  g1.gain.setValueAtTime(0, t)
  g1.gain.linearRampToValueAtTime(vol, t + attack)
  g1.gain.exponentialRampToValueAtTime(vol * 0.2, t + dur * 0.5)
  g1.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  g2.gain.setValueAtTime(0, t)
  g2.gain.linearRampToValueAtTime(vol * 0.3, t + attack)
  g2.gain.exponentialRampToValueAtTime(vol * 0.06, t + dur * 0.5)
  g2.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  master.gain.value = 0.8

  osc1.connect(g1)
  osc2.connect(g2)
  g1.connect(filter)
  g2.connect(filter)
  filter.connect(master)
  master.connect(dest)
  if (rev) master.connect(rev)

  osc1.start(t); osc1.stop(t + dur + 0.02)
  osc2.start(t); osc2.stop(t + dur + 0.02)
}

function chimeChord(
  c: AudioContext,
  freqs: number[],
  t: number,
  dur: number,
  vol: number,
  dest: AudioNode,
  rev?: AudioNode
) {
  freqs.forEach((f, i) => {
    chime(c, f, t + i * 0.008, dur - i * 0.015, vol / Math.max(freqs.length, 1.7), dest, rev)
  })
}

const CATEGORY_SOUNDS: Record<string, (c: AudioContext, t: number, dest: AudioNode, rev?: AudioNode) => void> = {
  Stimulants(c, t, dest, rev) {
    chimeChord(c, [587.33, 783.99], t, 0.16, 0.2, dest, rev)
  },

  Depressants(c, t, dest, rev) {
    chimeChord(c, [164.81, 246.94], t, 0.22, 0.2, dest, rev)
  },

  Psychedelics(c, t, dest, rev) {
    chimeChord(c, [329.63, 493.88], t, 0.18, 0.18, dest, rev)
  },

  Dissociatives(c, t, dest, rev) {
    chimeChord(c, [277.18, 440], t, 0.17, 0.18, dest, rev)
  },

  Entactogens(c, t, dest, rev) {
    chimeChord(c, [392, 587.33], t, 0.16, 0.2, dest, rev)
  },

  Opioids(c, t, dest, rev) {
    chimeChord(c, [146.83, 220], t, 0.24, 0.2, dest, rev)
  },

  Cannabinoids(c, t, dest, rev) {
    chimeChord(c, [261.63, 392], t, 0.18, 0.18, dest, rev)
  },

  Inhalants(c, t, dest, rev) {
    chimeChord(c, [523.25, 783.99], t, 0.12, 0.19, dest, rev)
  },

  Deliriants(c, t, dest, rev) {
    chimeChord(c, [233.08, 349.23], t, 0.16, 0.18, dest, rev)
  },

  Gabapentionoids(c, t, dest, rev) {
    chimeChord(c, [311.13, 466.16], t, 0.15, 0.2, dest, rev)
  },

  Nootropics(c, t, dest, rev) {
    chimeChord(c, [440, 659.25], t, 0.14, 0.2, dest, rev)
  },

  Antidepressants(c, t, dest, rev) {
    chimeChord(c, [293.66, 440], t, 0.18, 0.18, dest, rev)
  },

  Antipsychotics(c, t, dest, rev) {
    chimeChord(c, [220, 349.23], t, 0.2, 0.18, dest, rev)
  },

  Dopaminergics(c, t, dest, rev) {
    chimeChord(c, [370, 587.33], t, 0.15, 0.2, dest, rev)
  },

  Supplements(c, t, dest, rev) {
    chimeChord(c, [329.63, 493.88], t, 0.15, 0.18, dest, rev)
  },

  Cathinones(c, t, dest, rev) {
    chimeChord(c, [493.88, 739.99], t, 0.12, 0.2, dest, rev)
  },
}

export function playCategoryClick(category: Category) {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.003
  const b = getReverbBus(c)
  const fn = CATEGORY_SOUNDS[category]
  if (fn) fn(c, t, c.destination, b.node)
  else playClick()
}

export function playClick() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.003
  const b = getReverbBus(c)
  chimeChord(c, [523.25, 783.99], t, 0.1, 0.22, c.destination, b.node)
}

export function playHover() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.003
  chime(c, 587.33 * 1.02, t, 0.08, 0.05, c.destination)
}

export function playOpen() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.003
  const b = getReverbBus(c)
  chimeChord(c, [329.63, 523.25], t, 0.14, 0.2, c.destination, b.node)
}

export function playClose() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.003
  const b = getReverbBus(c)
  chimeChord(c, [261.63, 440], t, 0.12, 0.18, c.destination, b.node)
}

export function playToggle() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.003
  const b = getReverbBus(c)
  chimeChord(c, [440, 659.25], t, 0.1, 0.18, c.destination, b.node)
}

export function playTab() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.003
  const b = getReverbBus(c)
  chime(c, 523.25, t, 0.08, 0.18, c.destination, b.node)
}

type PopupTab = 'overview' | 'effects' | 'risks' | 'dosage' | 'tolerance' | 'interactions' | 'legal'

const TAB_SOUNDS: Record<PopupTab, (c: AudioContext, t: number, dest: AudioNode, rev?: AudioNode) => void> = {
  overview(c, t, dest, rev) {
    chimeChord(c, [329.63, 523.25], t, 0.09, 0.18, dest, rev)
  },
  effects(c, t, dest, rev) {
    chimeChord(c, [392, 622.25], t, 0.09, 0.18, dest, rev)
  },
  risks(c, t, dest, rev) {
    chimeChord(c, [293.66, 493.88], t, 0.1, 0.2, dest, rev)
  },
  dosage(c, t, dest, rev) {
    chimeChord(c, [440, 698.46], t, 0.08, 0.18, dest, rev)
  },
  tolerance(c, t, dest, rev) {
    chimeChord(c, [349.23, 554.37], t, 0.09, 0.18, dest, rev)
  },
  interactions(c, t, dest, rev) {
    chimeChord(c, [311.13, 466.16], t, 0.09, 0.18, dest, rev)
  },
  legal(c, t, dest, rev) {
    chimeChord(c, [415.25, 622.25], t, 0.09, 0.18, dest, rev)
  },
}

export function playPopupTab(tab: string) {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.003
  const b = getReverbBus(c)
  const fn = TAB_SOUNDS[tab as PopupTab]
  if (fn) fn(c, t, c.destination, b.node)
  else playTab()
}

export function playSearch() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.003
  const b = getReverbBus(c)
  chimeChord(c, [392, 622.25], t, 0.08, 0.19, c.destination, b.node)
}

export function playFavorite() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.003
  const b = getReverbBus(c)
  chimeChord(c, [349.23, 523.25, 783.99], t, 0.18, 0.2, c.destination, b.node)
}

export function playSectionChange() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.003
  const b = getReverbBus(c)
  chimeChord(c, [261.63, 392, 523.25], t, 0.16, 0.2, c.destination, b.node)
}