import type { Category } from '@/lib/types'

const STORAGE_KEY = 'tripgem-ui-sounds'

let ctx: AudioContext | null = null
let _enabled = true
let _initListenersAdded = false

function getCtx(autoResume = true): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        ctx = new AudioContextClass()
      }
    }
    if (autoResume && ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    return ctx
  } catch {
    return null
  }
}

function makeLofiReverb(c: AudioContext): ConvolverNode {
  const len = c.sampleRate * 1.0
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let env = 1.0
    const decay = Math.exp(-1 / (c.sampleRate * 0.25))
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * env
      env *= decay
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

  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const c = getCtx(false)
      if (c && !_reverbBus) {
        getReverbBus(c)
      }
    }, 200)
  }

  if (typeof window !== 'undefined' && !_initListenersAdded) {
    _initListenersAdded = true
    const unlock = async () => {
      try {
        const c = getCtx(false)
        if (!c) return
        if (c.state === 'suspended') {
          await c.resume()
        }
        if (c.state === 'running') {
          const buffer = c.createBuffer(1, 1, 22050)
          const source = c.createBufferSource()
          source.buffer = buffer
          source.connect(c.destination)
          source.start(0)

          window.removeEventListener('click', unlock)
          window.removeEventListener('touchstart', unlock)
          window.removeEventListener('touchend', unlock)
        }
      } catch {}
    }
    window.addEventListener('click', unlock, { passive: true })
    window.addEventListener('touchstart', unlock, { passive: true })
    window.addEventListener('touchend', unlock, { passive: true })
  }
}

function play(fn: (c: AudioContext) => void) {
  if (!_enabled) return
  const c = getCtx()
  if (!c) return
  requestAnimationFrame(() => fn(c))
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
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = freq
  osc.detune.value = 3

  const gain = c.createGain()
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 4000
  filter.Q.value = 0.3

  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(vol, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)

  osc.connect(gain)
  gain.connect(filter)
  filter.connect(dest)
  if (rev) gain.connect(rev)

  osc.start(t); osc.stop(t + dur + 0.02)
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

export function playCategoryClick(category: Category) {
  play((c) => {
    const t = c.currentTime + 0.003
    const b = getReverbBus(c)
    chime(c, 440, t, 0.1, 0.2, c.destination, b.node)
  })
}

export function playClick() {
  play((c) => {
    const t = c.currentTime + 0.003
    chime(c, 523.25, t, 0.08, 0.18, c.destination)
  })
}

export function playOpen() {
  play((c) => {
    const t = c.currentTime + 0.003
    const b = getReverbBus(c)
    chime(c, 329.63, t, 0.12, 0.2, c.destination, b.node)
  })
}

export function playClose() {
  play((c) => {
    const t = c.currentTime + 0.003
    const b = getReverbBus(c)
    chime(c, 261.63, t, 0.1, 0.18, c.destination, b.node)
  })
}

export function playToggle() {
  play((c) => {
    const t = c.currentTime + 0.003
    const b = getReverbBus(c)
    chime(c, 440, t, 0.08, 0.18, c.destination, b.node)
  })
}

export function playTab() {
  play((c) => {
    const t = c.currentTime + 0.003
    chime(c, 523.25, t, 0.06, 0.15, c.destination)
  })
}

type PopupTab = 'overview' | 'effects' | 'risks' | 'dosage' | 'tolerance' | 'interactions' | 'legal'

const TAB_SOUNDS: Record<PopupTab, number> = {
  overview: 329.63,
  effects: 392,
  risks: 293.66,
  dosage: 440,
  tolerance: 349.23,
  interactions: 311.13,
  legal: 415.25,
}

export function playPopupTab(tab: string) {
  play((c) => {
    const t = c.currentTime + 0.003
    const b = getReverbBus(c)
    const freq = TAB_SOUNDS[tab as PopupTab] || 523.25
    chime(c, freq, t, 0.07, 0.18, c.destination, b.node)
  })
}

export function playSearch() {
  play((c) => {
    const t = c.currentTime + 0.003
    chime(c, 392, t, 0.06, 0.16, c.destination)
  })
}

export function playFavorite() {
  play((c) => {
    const t = c.currentTime + 0.003
    const b = getReverbBus(c)
    chime(c, 523.25, t, 0.15, 0.2, c.destination, b.node)
  })
}

export function playSectionChange() {
  play((c) => {
    const t = c.currentTime + 0.003
    const b = getReverbBus(c)
    chime(c, 392, t, 0.14, 0.2, c.destination, b.node)
  })
}
