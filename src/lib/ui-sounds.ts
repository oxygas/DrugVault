import type { Category } from '@/lib/types'

const STORAGE_KEY = 'tripgem-ui-sounds'

let ctx: AudioContext | null = null
let _enabled = true

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function makeReverb(c: AudioContext, sec: number, decay: number): ConvolverNode {
  const len = c.sampleRate * sec
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * decay))
  }
  const n = c.createConvolver()
  n.buffer = buf
  return n
}

let _reverbBus: { node: GainNode; rev: ConvolverNode } | null = null
function getReverbBus(c: AudioContext, sec = 3.0, decay = 1.5): { node: GainNode; rev: ConvolverNode } {
  if (_reverbBus) return _reverbBus
  const rev = makeReverb(c, sec, decay)
  const node = c.createGain()
  node.gain.value = 0.5
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

function crystal(
  c: AudioContext, freq: number, t: number, dur: number, vol: number,
  dest: AudioNode, rev?: AudioNode
) {
  const o1 = c.createOscillator()
  const o2 = c.createOscillator()
  const g = c.createGain()
  o1.type = 'sine'
  o2.type = 'sine'
  o1.frequency.setValueAtTime(freq, t)
  o1.frequency.exponentialRampToValueAtTime(freq * 0.97, t + dur * 0.7)
  o2.frequency.setValueAtTime(freq * 2, t)
  o2.frequency.exponentialRampToValueAtTime(freq * 2 * 0.97, t + dur * 0.7)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o1.connect(g)
  const g2 = c.createGain()
  g2.gain.value = 0.12
  o2.connect(g2)
  g2.connect(g)
  g.connect(dest)
  if (rev) g.connect(rev)
  o1.start(t); o1.stop(t + dur + 0.02)
  o2.start(t); o2.stop(t + dur + 0.02)
}

function ghost(c: AudioContext, freq: number, t: number, vol: number, dest: AudioNode) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.value = freq
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  o.connect(g)
  g.connect(dest)
  o.start(t)
  o.stop(t + 0.07)
}

const CATEGORY_SOUNDS: Record<string, (c: AudioContext, t: number, dest: AudioNode) => void> = {
  Stimulants(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 523.25, t, 0.28, 0.30, dest, b.node)
  },

  Depressants(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 130.81, t, 0.4, 0.30, dest, b.node)
  },

  Psychedelics(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 329.63, t, 0.32, 0.25, dest, b.node)
    crystal(c, 466.16, t, 0.32, 0.18, dest, b.node)
  },

  Dissociatives(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 587.33, t, 0.25, 0.28, dest, b.node)
  },

  Entactogens(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 261.63, t, 0.35, 0.25, dest, b.node)
    crystal(c, 493.88, t, 0.35, 0.14, dest, b.node)
  },

  Opioids(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 110.00, t, 0.45, 0.28, dest, b.node)
  },

  Cannabinoids(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 349.23, t, 0.32, 0.28, dest, b.node)
  },

  Inhalants(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 415.30, t, 0.22, 0.26, dest, b.node)
  },

  Deliriants(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 261.63, t, 0.3, 0.25, dest, b.node)
    crystal(c, 369.99, t, 0.3, 0.16, dest, b.node)
  },

  Gabapentionoids(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 293.66, t, 0.3, 0.28, dest, b.node)
  },

  Nootropics(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 440.00, t, 0.25, 0.30, dest, b.node)
  },

  Antidepressants(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 220.00, t, 0.32, 0.28, dest, b.node)
  },

  Antipsychotics(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 196.00, t, 0.35, 0.26, dest, b.node)
  },

  Dopaminergics(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 466.16, t, 0.24, 0.28, dest, b.node)
  },

  Supplements(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 329.63, t, 0.3, 0.28, dest, b.node)
  },

  Cathinones(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 622.25, t, 0.2, 0.26, dest, b.node)
  },
}

export function playCategoryClick(category: Category) {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.01
  const fn = CATEGORY_SOUNDS[category]
  if (fn) fn(c, t, c.destination)
  else playClick()
}

export function playClick() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.01
  const b = getReverbBus(c)
  crystal(c, 440, t, 0.2, 0.25, c.destination, b.node)
}

export function playHover() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.01
  ghost(c, 523.25, t, 0.06, c.destination)
}

export function playOpen() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.01
  const b = getReverbBus(c)
  crystal(c, 261.63, t, 0.3, 0.25, c.destination, b.node)
}

export function playClose() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.01
  const b = getReverbBus(c)
  crystal(c, 220.00, t, 0.25, 0.22, c.destination, b.node)
}

export function playToggle() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.01
  const b = getReverbBus(c)
  crystal(c, 311.13, t, 0.15, 0.20, c.destination, b.node)
}

export function playTab() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.01
  const b = getReverbBus(c)
  crystal(c, 349.23, t, 0.22, 0.22, c.destination, b.node)
}

type PopupTab = 'overview' | 'effects' | 'risks' | 'dosage' | 'tolerance' | 'interactions' | 'legal'

const TAB_SOUNDS: Record<PopupTab, (c: AudioContext, t: number, dest: AudioNode) => void> = {
  overview(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 293.66, t, 0.22, 0.22, dest, b.node)
  },
  effects(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 349.23, t, 0.22, 0.22, dest, b.node)
  },
  risks(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 207.65, t, 0.26, 0.24, dest, b.node)
  },
  dosage(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 392.00, t, 0.22, 0.22, dest, b.node)
  },
  tolerance(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 277.18, t, 0.24, 0.22, dest, b.node)
  },
  interactions(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 233.08, t, 0.24, 0.22, dest, b.node)
  },
  legal(c, t, dest) {
    const b = getReverbBus(c)
    crystal(c, 329.63, t, 0.22, 0.22, dest, b.node)
  },
}

export function playPopupTab(tab: string) {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.01
  const fn = TAB_SOUNDS[tab as PopupTab]
  if (fn) fn(c, t, c.destination)
  else playTab()
}

export function playSearch() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.01
  const b = getReverbBus(c)
  crystal(c, 329.63, t, 0.22, 0.24, c.destination, b.node)
}

export function playFavorite() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.01
  const b = getReverbBus(c)
  crystal(c, 261.63, t, 0.3, 0.25, c.destination, b.node)
  crystal(c, 329.63, t, 0.3, 0.14, c.destination, b.node)
}

export function playSectionChange() {
  if (!_enabled) return
  const c = getCtx()
  const t = c.currentTime + 0.01
  const b = getReverbBus(c)
  crystal(c, 174.61, t, 0.3, 0.25, c.destination, b.node)
}
