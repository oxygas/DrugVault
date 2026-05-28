'use client'

import { useCallback, useRef, useState } from 'react'

function createDrone(ctx: AudioContext, dest: AudioNode) {
  const masterGain = ctx.createGain()
  masterGain.gain.value = 0
  masterGain.connect(dest)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 300
  filter.Q.value = 2
  masterGain.connect(filter)

  const reverb = ctx.createConvolver()
  const reverbGain = ctx.createGain()
  reverbGain.gain.value = 0.4

  const noiseLen = ctx.sampleRate * 2
  const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate)
  const data = noiseBuf.getChannelData(0)
  for (let i = 0; i < noiseLen; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3))
  }
  reverb.buffer = noiseBuf

  filter.connect(reverb)
  reverb.connect(reverbGain)
  reverbGain.connect(dest)
  filter.connect(dest)

  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.type = 'sine'
  lfo.frequency.value = 0.06
  lfoGain.gain.value = 150
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)
  lfo.start()

  const subLfo = ctx.createOscillator()
  const subLfoGain = ctx.createGain()
  subLfo.type = 'sine'
  subLfo.frequency.value = 0.12
  subLfoGain.gain.value = 80
  subLfo.connect(subLfoGain)
  subLfoGain.connect(filter.detune)
  subLfo.start()

  const oscs: { osc: OscillatorNode; gain: GainNode }[] = []
  const baseFreq = 27.5
  const tunings = [1, 1.003, 0.998, 2, 2.004, 3.997, 4, 4.005]
  const gains = [0.04, 0.03, 0.025, 0.022, 0.018, 0.012, 0.01, 0.008]

  tunings.forEach((ratio, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = i < 4 ? 'sine' : 'sawtooth'
    osc.frequency.value = baseFreq * ratio
    gain.gain.value = gains[i]
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start()
    oscs.push({ osc, gain })
  })

  const pulseOsc = ctx.createOscillator()
  const pulseGain = ctx.createGain()
  pulseOsc.type = 'square'
  pulseOsc.frequency.value = 0.5
  pulseGain.gain.value = 0
  const pulseAmp = ctx.createGain()
  pulseAmp.gain.value = 0.012
  pulseOsc.connect(pulseGain)
  pulseGain.connect(pulseAmp)
  pulseAmp.connect(filter)
  pulseOsc.start()

  const noise = ctx.createOscillator()
  const noiseGain = ctx.createGain()
  noise.type = 'sawtooth'
  noise.frequency.value = 20
  noiseGain.gain.value = 0.003
  noise.connect(noiseGain)
  noiseGain.connect(filter)
  noise.start()
  oscs.push({ osc: noise, gain: noiseGain })

  let fadeTarget = 0
  let fadeCurrent = 0

  function fadeTo(val: number) {
    fadeTarget = val
  }

  function tick() {
    fadeCurrent += (fadeTarget - fadeCurrent) * 0.02
    masterGain.gain.value = fadeCurrent
    pulseGain.gain.value = fadeCurrent > 0.01 ? 1 : 0
    if (Math.abs(fadeCurrent - fadeTarget) > 0.001) {
      requestAnimationFrame(tick)
    }
  }

  return {
    fadeTo,
    startFade: () => { fadeCurrent = 0; tick() },
    stop: () => {
      oscs.forEach(({ osc, gain }) => {
        try { gain.gain.value = 0; osc.stop() } catch {}
      })
      try { pulseOsc.stop() } catch {}
      lfo.stop()
      subLfo.stop()
      masterGain.disconnect()
      filter.disconnect()
    },
  }
}

export default function AmbientSound() {
  const [active, setActive] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const droneRef = useRef<ReturnType<typeof createDrone> | null>(null)

  const toggle = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new AudioContext()
      ctxRef.current = ctx
      const drone = createDrone(ctx, ctx.destination)
      droneRef.current = drone
      drone.startFade()
      drone.fadeTo(0.5)
      setActive(true)
    } else if (droneRef.current) {
      if (active) {
        droneRef.current.fadeTo(0)
        setTimeout(() => {
          ctxRef.current?.close()
          ctxRef.current = null
          droneRef.current = null
        }, 2000)
        setActive(false)
      } else {
        const ctx = new AudioContext()
        ctxRef.current = ctx
        const drone = createDrone(ctx, ctx.destination)
        droneRef.current = drone
        drone.startFade()
        drone.fadeTo(0.5)
        setActive(true)
      }
    }
  }, [active])

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-[9998] w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 cursor-pointer"
      style={{
        background: active ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.04)',
        borderColor: active ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.1)',
        boxShadow: active
          ? '0 0 20px rgba(139, 92, 246, 0.2), 0 0 40px rgba(139, 92, 246, 0.08), inset 0 0 12px rgba(139, 92, 246, 0.06)'
          : 'none',
      }}
      aria-label={active ? 'Mute ambient sound' : 'Enable ambient sound'}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: active ? 1 : 0.5, color: active ? '#c084fc' : '#64748b' }}
      >
        {active ? (
          <>
            <path d="M2 10v4" />
            <path d="M7 6v12" />
            <path d="M12 3v18" />
            <path d="M17 8v8" />
            <path d="M22 5v14" />
          </>
        ) : (
          <>
            <path d="M12 3v18" />
            <line x1="3" y1="3" x2="21" y2="21" />
          </>
        )}
      </svg>
    </button>
  )
}
