'use client'

import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0616]"
      style={{ animation: 'fadeOut 0.3s ease-in-out 1.2s forwards' }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <img 
          src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXFkdHQzaHphODF6Y3Rlb2JnMTYybzlsaHVibG8zZXNpYjAybWc4NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Wt0zLr2PkDbDkfQOSo/giphy.gif" 
          alt="TripGem" 
          className="w-32 h-32"
        />
        <span className="font-display font-extrabold text-5xl tracking-tight">
          <span className="tripgem-text-trip">Trip</span>
          <span className="tripgem-text-gem">Gem</span>
        </span>
      </div>
    </div>
  )
}