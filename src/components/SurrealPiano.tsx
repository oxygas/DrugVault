'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useUIStore } from '@/stores/ui'

// Type definitions
type PresetName = 'Neon Glow' | 'Cyberpunk' | 'Trance' | 'Ethereal'

interface Note {
  note: string
  freq: number
  isBlack: boolean
  keyChar: string
  hue: number // Psychedelic hue representation
}

// 13 Notes in C4-C5 octave
const NOTES: Note[] = [
  { note: 'C4', freq: 261.63, isBlack: false, keyChar: 'A', hue: 0 },
  { note: 'C#4', freq: 277.18, isBlack: true, keyChar: 'W', hue: 30 },
  { note: 'D4', freq: 293.66, isBlack: false, keyChar: 'S', hue: 60 },
  { note: 'D#4', freq: 311.13, isBlack: true, keyChar: 'E', hue: 90 },
  { note: 'E4', freq: 329.63, isBlack: false, keyChar: 'D', hue: 120 },
  { note: 'F4', freq: 349.23, isBlack: false, keyChar: 'F', hue: 150 },
  { note: 'F#4', freq: 369.99, isBlack: true, keyChar: 'T', hue: 180 },
  { note: 'G4', freq: 392.00, isBlack: false, keyChar: 'G', hue: 210 },
  { note: 'G#4', freq: 415.30, isBlack: true, keyChar: 'Y', hue: 240 },
  { note: 'A4', freq: 440.00, isBlack: false, keyChar: 'H', hue: 270 },
  { note: 'A#4', freq: 466.16, isBlack: true, keyChar: 'U', hue: 300 },
  { note: 'B4', freq: 493.88, isBlack: false, keyChar: 'J', hue: 330 },
  { note: 'C5', freq: 523.25, isBlack: false, keyChar: 'K', hue: 360 },
]

// Visual Particle structure
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
  life: number
  maxLife: number
}

// Visual Ripple structure
interface Ripple {
  x: number
  y: number
  radius: number
  color: string
  alpha: number
  life: number
  maxLife: number
}

const PRESET_DESCRIPTIONS: Record<PresetName, string> = {
  'Neon Glow': 'Warm dreamwave keys with smooth FM filter sweep and soft delay.',
  'Cyberpunk': 'High-gain detuned saw lead with industrial waveshaper grit.',
  'Trance': 'Hyper detuned super-saws with sharp resonance and fast delay lines.',
  'Ethereal': 'Slow-blooming ambient plucked chime with chorus shimmer wash.',
}

export default function SurrealPiano() {
  const { pianoOpen, setPianoOpen } = useUIStore()
  const [activePreset, setActivePreset] = useState<PresetName>('Neon Glow')
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({})

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  
  // Audio Nodes (Singletons for routing delay/reverb/effects)
  const masterGainRef = useRef<GainNode | null>(null)
  const delayNodeRef = useRef<DelayNode | null>(null)
  const delayGainRef = useRef<GainNode | null>(null)
  const distortionNodeRef = useRef<WaveShaperNode | null>(null)
  const filterNodeRef = useRef<BiquadFilterNode | null>(null)
  
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const ripplesRef = useRef<Ripple[]>([])
  const requestRef = useRef<number | null>(null)

  // Initialize Web Audio Engine
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContextClass()
      audioCtxRef.current = ctx

      // Master Gain
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.35, ctx.currentTime)
      masterGain.connect(ctx.destination)
      masterGainRef.current = masterGain

      // Biquad Filter (dynamic sweeps)
      const filterNode = ctx.createBiquadFilter()
      filterNode.type = 'lowpass'
      filterNode.frequency.setValueAtTime(2000, ctx.currentTime)
      filterNode.connect(masterGain)
      filterNodeRef.current = filterNode

      // Waveshaper (distortion curve)
      const distortion = ctx.createWaveShaper()
      distortion.curve = makeDistortionCurve(60)
      distortion.oversample = '4x'
      distortion.connect(filterNode)
      distortionNodeRef.current = distortion

      // Delay Node
      const delayNode = ctx.createDelay(1.0)
      delayNode.delayTime.setValueAtTime(0.3, ctx.currentTime)
      
      const delayGain = ctx.createGain()
      delayGain.gain.setValueAtTime(0.4, ctx.currentTime)

      // Feed delay back into itself
      delayNode.connect(delayGain)
      delayGain.connect(delayNode)
      
      // Route signals to master
      delayGain.connect(masterGain)
      delayNodeRef.current = delayNode
      delayGainRef.current = delayGain

      return ctx
    } catch (e) {
      console.error('Failed to initialize AudioContext:', e)
      return null
    }
  }, [])

  // Distortion Curve Helper
  function makeDistortionCurve(amount = 20) {
    const k = typeof amount === 'number' ? amount : 50
    const n_samples = 44100
    const curve = new Float32Array(n_samples)
    const deg = Math.PI / 180
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
    }
    return curve
  }

  // Synthesize / Trigger Note
  const triggerNote = useCallback((note: Note) => {
    // Ensure Web Audio is loaded and unlocked
    const ctx = initAudio()
    if (!ctx) return
    
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    // Re-adjust master delay settings depending on preset
    if (delayNodeRef.current && delayGainRef.current && filterNodeRef.current) {
      if (activePreset === 'Neon Glow') {
        delayNodeRef.current.delayTime.setTargetAtTime(0.35, now, 0.05)
        delayGainRef.current.gain.setTargetAtTime(0.3, now, 0.05)
        filterNodeRef.current.type = 'lowpass'
        filterNodeRef.current.frequency.setTargetAtTime(1500, now, 0.05)
        filterNodeRef.current.Q.setTargetAtTime(1.0, now, 0.05)
      } else if (activePreset === 'Cyberpunk') {
        delayNodeRef.current.delayTime.setTargetAtTime(0.18, now, 0.05)
        delayGainRef.current.gain.setTargetAtTime(0.25, now, 0.05)
        filterNodeRef.current.type = 'highpass'
        filterNodeRef.current.frequency.setTargetAtTime(350, now, 0.05)
        filterNodeRef.current.Q.setTargetAtTime(2.0, now, 0.05)
      } else if (activePreset === 'Trance') {
        delayNodeRef.current.delayTime.setTargetAtTime(0.28, now, 0.05)
        delayGainRef.current.gain.setTargetAtTime(0.45, now, 0.05)
        filterNodeRef.current.type = 'lowpass'
        filterNodeRef.current.frequency.setTargetAtTime(1200, now, 0.05)
        filterNodeRef.current.Q.setTargetAtTime(6.0, now, 0.05)
      } else if (activePreset === 'Ethereal') {
        delayNodeRef.current.delayTime.setTargetAtTime(0.55, now, 0.05)
        delayGainRef.current.gain.setTargetAtTime(0.65, now, 0.05)
        filterNodeRef.current.type = 'lowpass'
        filterNodeRef.current.frequency.setTargetAtTime(2500, now, 0.05)
        filterNodeRef.current.Q.setTargetAtTime(0.5, now, 0.05)
      }
    }

    // Oscillators
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const voiceGain = ctx.createGain()

    voiceGain.gain.setValueAtTime(0, now)

    // Detuned Second Oscillator & Envelope Timing Configurations
    let attack = 0.01
    let decay = 0.2
    let sustain = 0.4
    let release = 0.6
    let oscType: OscillatorType = 'sine'

    switch (activePreset) {
      case 'Neon Glow':
        oscType = 'sine'
        osc1.type = oscType
        osc2.type = 'triangle'
        osc2.frequency.setValueAtTime(note.freq * 2.002, now) // FM harmonic double detune
        osc2.connect(voiceGain)
        
        attack = 0.04
        decay = 0.4
        sustain = 0.5
        release = 0.8
        break

      case 'Cyberpunk':
        oscType = 'sawtooth'
        osc1.type = oscType
        osc2.type = 'sawtooth'
        osc2.frequency.setValueAtTime(note.freq * 1.008, now) // Aggressive detune
        osc2.connect(voiceGain)
        
        attack = 0.005
        decay = 0.12
        sustain = 0.3
        release = 0.25
        break

      case 'Trance':
        oscType = 'sawtooth'
        osc1.type = oscType
        osc2.type = 'triangle'
        osc2.frequency.setValueAtTime(note.freq * 0.992, now)
        osc2.connect(voiceGain)

        attack = 0.015
        decay = 0.22
        sustain = 0.6
        release = 0.45
        break

      case 'Ethereal':
        oscType = 'triangle'
        osc1.type = oscType
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(note.freq * 3.003, now) // Crystal fifth detune
        osc2.connect(voiceGain)

        attack = 0.15
        decay = 0.6
        sustain = 0.7
        release = 1.6
        break
    }

    osc1.type = oscType
    osc1.frequency.setValueAtTime(note.freq, now)
    osc1.connect(voiceGain)

    // Route note synthesizer voice
    if (activePreset === 'Cyberpunk' && distortionNodeRef.current) {
      // Route through high distortion node
      voiceGain.connect(distortionNodeRef.current)
    } else if (filterNodeRef.current) {
      // Direct routing bypassing waveshaper
      voiceGain.connect(filterNodeRef.current)
    }

    // Connect note to delay line for psychedelic decay
    if (delayNodeRef.current) {
      voiceGain.connect(delayNodeRef.current)
    }

    // ADS Envelope Trigger
    voiceGain.gain.linearRampToValueAtTime(0.5, now + attack)
    voiceGain.gain.setTargetAtTime(sustain * 0.5, now + attack, decay)

    // Stop Oscillator & Voice
    osc1.start(now)
    osc2.start(now)

    // Let the key sound ring, then trigger fade release on release
    const keyLiftTime = 0.2 // Default hold duration
    const stopTime = now + keyLiftTime + release
    
    voiceGain.gain.setValueAtTime(sustain * 0.5, now + keyLiftTime)
    voiceGain.gain.setTargetAtTime(0, now + keyLiftTime, release * 0.3)

    osc1.stop(stopTime)
    osc2.stop(stopTime)

    // Canvas visual interactions triggers
    spawnVisuals(note)
  }, [activePreset, initAudio])

  // Spawn visual assets inside Canvas on note play
  const spawnVisuals = (note: Note) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const color = `hsla(${note.hue}, 95%, 65%, 1)`
    const highlightColor = `hsla(${note.hue}, 95%, 75%, 0.8)`

    // Retrieve note-key index positioning
    const index = NOTES.findIndex(n => n.note === note.note)
    const totalKeys = NOTES.length
    const xPos = canvas.width * 0.05 + (canvas.width * 0.9 * (index + 0.5) / totalKeys)
    const yPos = canvas.height * 0.8 // Emitting point from notes

    // Trigger Ripples
    ripplesRef.current.push({
      x: xPos,
      y: yPos,
      radius: 5,
      color,
      alpha: 1.0,
      life: 0,
      maxLife: 60,
    })

    // Particle Bursts
    const numParticles = activePreset === 'Cyberpunk' ? 25 : 12
    for (let i = 0; i < numParticles; i++) {
      const angle = -Math.PI / 2 + (Math.random() * Math.PI * 0.6 - Math.PI * 0.3)
      const speed = 2 + Math.random() * 6
      particlesRef.current.push({
        x: xPos,
        y: yPos,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color: Math.random() > 0.4 ? color : highlightColor,
        alpha: 1.0,
        life: 0,
        maxLife: 40 + Math.random() * 40,
      })
    }
  }

  // Key Play Actions
  const playKey = useCallback((note: Note) => {
    // Flash pressed keys visual state
    setPressedKeys(prev => ({ ...prev, [note.note]: true }))
    triggerNote(note)
    setTimeout(() => {
      setPressedKeys(prev => ({ ...prev, [note.note]: false }))
    }, 180)
  }, [triggerNote])

  // Canvas Animation loop
  const drawRef = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Dynamic background blend clearing
    ctx.fillStyle = 'rgba(10, 4, 24, 0.16)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Render psychedelic auras
    ripplesRef.current.forEach((ripple, index) => {
      ripple.life++
      ripple.radius += 2.8
      ripple.alpha = 1 - ripple.life / ripple.maxLife

      ctx.beginPath()
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
      ctx.strokeStyle = ripple.color.replace('1)', `${ripple.alpha})`)
      ctx.lineWidth = 2.5 + ripple.radius * 0.02
      ctx.stroke()

      // Secondary outer blurry halo
      ctx.beginPath()
      ctx.arc(ripple.x, ripple.y, ripple.radius * 1.15, 0, Math.PI * 2)
      ctx.strokeStyle = ripple.color.replace('1)', `${ripple.alpha * 0.25})`)
      ctx.lineWidth = 6
      ctx.stroke()
    })

    // Filter dead ripples
    ripplesRef.current = ripplesRef.current.filter(r => r.life < r.maxLife)

    // Draw Particles
    particlesRef.current.forEach((p) => {
      p.life++
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05 // Gravity drag
      p.alpha = 1 - p.life / p.maxLife

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = p.color.replace('1)', `${p.alpha})`)
      ctx.shadowBlur = 8
      ctx.shadowColor = p.color
      ctx.fill()
      ctx.shadowBlur = 0 // Reset
    })

    particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife)

    // Loop frame
    requestRef.current = requestAnimationFrame(drawRef)
  }, [activePreset])

  // Desktop keyboard controls mapping listeners
  useEffect(() => {
    if (!pianoOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when the user is actively searching or entering values
      const activeEl = document.activeElement
      if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
        return
      }

      const key = e.key.toUpperCase()
      const matched = NOTES.find(n => n.keyChar === key)
      if (matched && !pressedKeys[matched.note]) {
        e.preventDefault()
        playKey(matched)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pianoOpen, playKey, pressedKeys])

  // Canvas context setups and sizing updates
  useEffect(() => {
    if (!pianoOpen) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      return
    }

    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 700
      canvas.height = 140
    }

    requestRef.current = requestAnimationFrame(drawRef)

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [pianoOpen, drawRef])

  if (!pianoOpen) return null

  return (
    <div
      className="fixed inset-0 z-[111] flex items-end sm:items-center justify-center p-3 sm:p-5"
      style={{ background: 'rgba(5, 2, 12, 0.75)', animation: 'fadeIn 0.25s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setPianoOpen(false)
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Surreal Neon Piano Board"
    >
      <div
        className="glass-strong neon-popup-glow w-full sm:max-w-4xl rounded-2xl overflow-hidden flex flex-col border border-[var(--border3)] relative"
        style={{
          background: 'linear-gradient(185deg, rgba(8, 4, 20, 0.98) 0%, rgba(16, 8, 38, 0.98) 100%)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '95dvh',
        }}
      >
        {/* Glow Header bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent2)] to-transparent opacity-80" />

        {/* Board Header details */}
        <div className="p-4 sm:p-5 border-b border-[var(--border2)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)] animate-pulse">
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 0L21 8.25M19.5 6C18.672 6 18 6.672 18 7.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zM9 15l10.5-3m0 0L21 14.25M19.5 12c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zM9 9c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5S9.828 9 9 9zm0 6c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5S9.828 15 9 15z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-display font-extrabold text-white leading-none flex items-center gap-2">
                Surreal Neon Synth <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">Unreal Mode</span>
              </h2>
              <p className="text-[11px] text-[var(--text4)] mt-1 font-mono">Press keys or play with keyboard A-K</p>
            </div>
          </div>
          
          <button
            onClick={() => setPianoOpen(false)}
            className="absolute top-4 right-4 sm:static p-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-all text-[var(--text4)] flex-shrink-0"
            aria-label="Close synth board"
          >
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Visual FX Panel Screen */}
        <div className="relative bg-[#05020c] border-b border-[var(--border2)] h-[130px] sm:h-[150px] overflow-hidden flex items-end">
          <canvas ref={canvasRef} className="w-full h-full block absolute inset-0 pointer-events-none" />
          
          {/* Neon scanline retro screen look */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-purple-950/5 to-transparent pointer-events-none opacity-20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(168,85,247,0.08),transparent_70%)] pointer-events-none" />
          
          {/* Preset Display info inside the screen */}
          <div className="absolute top-3 left-4 right-4 sm:top-4 sm:left-5 pointer-events-none z-10 max-w-sm">
            <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest block mb-0.5 sm:mb-1">Active Core Engine</span>
            <div className="text-lg sm:text-xl font-display font-black text-white tracking-wide uppercase flex items-center gap-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {activePreset}
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_#34d399]" />
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--text4)] mt-1 font-mono tracking-tight leading-relaxed line-clamp-2">
              {PRESET_DESCRIPTIONS[activePreset]}
            </p>
          </div>
        </div>

        {/* Controller / Selector Panel */}
        <div className="p-4 sm:p-5 bg-[#090515]/80 border-b border-[var(--border2)] flex flex-col gap-3 relative z-10">
          <span className="text-[10px] font-mono text-[var(--text4)] uppercase tracking-[0.16em]">
            Select Sonic Preset Persona
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {(['Neon Glow', 'Cyberpunk', 'Trance', 'Ethereal'] as PresetName[]).map((preset) => {
              const active = activePreset === preset
              let btnColor = 'var(--accent2)'
              if (preset === 'Cyberpunk') btnColor = 'var(--red)'
              if (preset === 'Trance') btnColor = 'var(--cyan)'
              if (preset === 'Ethereal') btnColor = 'var(--green2)'

              return (
                <button
                  key={preset}
                  onClick={() => setActivePreset(preset)}
                  className={`relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-display text-xs font-extrabold uppercase tracking-wider transition-all duration-300 group ${
                    active
                      ? 'bg-purple-950/15 border-purple-500/40 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'bg-black/20 border-[var(--border)] text-[var(--text3)] hover:text-white hover:border-[var(--border2)]'
                  }`}
                  style={{
                    borderColor: active ? btnColor : undefined,
                    boxShadow: active ? `0 0 15px color-mix(in srgb, ${btnColor} 20%, transparent)` : undefined
                  }}
                >
                  <div 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      active ? 'animate-pulse scale-125' : 'bg-transparent border border-gray-600'
                    }`} 
                    style={{ background: active ? btnColor : undefined }}
                  />
                  {preset}
                </button>
              )
            })}
          </div>
        </div>

        {/* The Keyboard Keys Board */}
        <div className="p-4 sm:p-8 bg-[#04020a] flex justify-center items-center overflow-x-auto relative z-10">
          <div className="flex relative w-full max-w-2xl h-[200px] select-none">
            {NOTES.map((note, index) => {
              const isPressed = pressedKeys[note.note]
              const noteColor = `hsla(${note.hue}, 95%, 65%, 1)`
              
              if (note.isBlack) {
                // Determine layout positioning offset for black keys
                let leftOffset = '0%'
                if (note.note === 'C#4') leftOffset = 'calc(100% * 1 / 8 - 14px)'
                if (note.note === 'D#4') leftOffset = 'calc(100% * 2 / 8 - 14px)'
                if (note.note === 'F#4') leftOffset = 'calc(100% * 4 / 8 - 14px)'
                if (note.note === 'G#4') leftOffset = 'calc(100% * 5 / 8 - 14px)'
                if (note.note === 'A#4') leftOffset = 'calc(100% * 6 / 8 - 14px)'

                return (
                  <button
                    key={note.note}
                    onMouseDown={() => playKey(note)}
                    onTouchStart={(e) => {
                      e.preventDefault()
                      playKey(note)
                    }}
                    className={`absolute w-[24px] sm:w-[28px] h-[110px] sm:h-[120px] rounded-b-md border transition-all duration-150 z-30 cursor-pointer shadow-lg`}
                    style={{
                      left: leftOffset,
                      background: isPressed 
                        ? `linear-gradient(to bottom, #110c1c, ${noteColor})` 
                        : 'linear-gradient(to bottom, #000, #1f1b2c)',
                      borderColor: isPressed ? noteColor : '#100c1e',
                      boxShadow: isPressed 
                        ? `0 0 16px ${noteColor}, 0 0 32px ${noteColor}` 
                        : 'inset 0 -5px 10px rgba(0,0,0,0.6)',
                    }}
                    aria-label={`Play note ${note.note}`}
                  >
                    <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center pointer-events-none">
                      <span className="text-[7px] font-mono font-bold text-gray-500 uppercase leading-none">{note.keyChar}</span>
                      <span className="text-[7px] font-mono font-bold text-[var(--text4)] mt-0.5">{note.note.replace('4','').replace('5','')}</span>
                    </div>
                  </button>
                )
              }

              // Rendering White Keys
              return (
                <button
                  key={note.note}
                  onMouseDown={() => playKey(note)}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    playKey(note)
                  }}
                  className={`flex-1 h-full rounded-b-lg border border-r-0 last:border-r transition-all duration-150 z-10 cursor-pointer relative`}
                  style={{
                    background: isPressed 
                      ? `linear-gradient(to bottom, #1a1525, ${noteColor}1a, ${noteColor})` 
                      : 'linear-gradient(to bottom, #110d22, #18152e)',
                    borderColor: isPressed ? noteColor : 'rgba(255,255,255,0.03)',
                    boxShadow: isPressed 
                      ? `0 0 20px ${noteColor}, inset 0 0 12px ${noteColor}40` 
                      : 'inset 0 -8px 15px rgba(0,0,0,0.4), inset 0 2px 2px rgba(255,255,255,0.02)',
                  }}
                  aria-label={`Play note ${note.note}`}
                >
                  <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center pointer-events-none">
                    <span 
                      className="text-[9px] font-mono font-bold uppercase transition-all duration-200"
                      style={{ color: isPressed ? '#fff' : 'rgba(255,255,255,0.2)' }}
                    >
                      {note.keyChar}
                    </span>
                    <span 
                      className="text-[8px] font-mono mt-1 transition-all duration-200"
                      style={{ color: isPressed ? noteColor : 'rgba(255,255,255,0.3)' }}
                    >
                      {note.note}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
