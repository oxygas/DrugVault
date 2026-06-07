'use client'

import { useEffect, useState } from 'react'

const GIF_URL = "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXFkdHQzaHphODF6Y3Rlb2JnMTYybzlsaHVibG8zZXNpYjAybWc4NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Wt0zLr2PkDbDkfQOSo/giphy.gif"

function LoadingLogo() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const r = requestAnimationFrame(() => {
      setIsMobile(matchMedia('(pointer: coarse)').matches)
    })
    return () => cancelAnimationFrame(r)
  }, [])

  return (
    <>
      {isMobile ? (
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
          <div className="absolute inset-0 animate-ping-slow rounded-full bg-[var(--accent)]/20" />
          <div className="absolute inset-2 animate-spin-slow rounded-full border-2 border-t-transparent border-[var(--accent)]/40" />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
            <img src="/tripgem-logo.png" alt="" className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
        </div>
      ) : (
        <img
          src={GIF_URL}
          alt="TripGem"
          className="w-28 h-28 sm:w-32 sm:h-32"
          fetchPriority="high"
          decoding="async"
        />
      )}
    </>
  )
}

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const isMobile = matchMedia('(pointer: coarse)').matches
    const ms = isMobile ? 800 : 1500
    const timer = setTimeout(() => setVisible(false), ms)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0616]"
      style={{ animation: 'fadeOut 0.2s ease-in-out 0.6s forwards' }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <LoadingLogo />
        <span className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">
          <span className="tripgem-text-trip">Trip</span>
          <span className="tripgem-text-gem">Gem</span>
        </span>
      </div>
    </div>
  )
}