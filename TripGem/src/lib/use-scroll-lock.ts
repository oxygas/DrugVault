'use client'

import { useEffect } from 'react'

export function useScrollLock(
  isOpen: boolean,
  scrollableSelector = '.popup-scroll-area, .substance-popup-scroll, .gemot-scroll-area'
) {
  useEffect(() => {
    if (!isOpen) return

    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startY = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      let target = e.target as HTMLElement | null
      let scrollable: HTMLElement | null = null

      // Traverse up to find the scrollable container
      while (target && target !== document.body) {
        if (target.nodeType === 1) {
          const isScrollableClass =
            target.classList.contains('popup-scroll-area') ||
            target.classList.contains('substance-popup-scroll') ||
            target.classList.contains('gemot-scroll-area')
          const matchesSelector = scrollableSelector ? target.matches?.(scrollableSelector) : false
          const hasOverflowStyle =
            target.style?.overflowY === 'auto' || target.style?.overflowY === 'scroll'

          if (isScrollableClass || matchesSelector || hasOverflowStyle) {
            scrollable = target
            break
          }
        }
        target = target.parentElement
      }

      if (!scrollable) {
        if (e.cancelable) e.preventDefault()
        return
      }

      const currentY = e.touches[0].clientY
      const deltaY = startY - currentY

      const scrollTop = scrollable.scrollTop
      const scrollHeight = scrollable.scrollHeight
      const clientHeight = scrollable.clientHeight

      // If dragging down (scrolling up) at the top boundary
      if (deltaY < 0 && scrollTop <= 0) {
        if (e.cancelable) e.preventDefault()
      }
      // If dragging up (scrolling down) at the bottom boundary
      else if (deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1) {
        if (e.cancelable) e.preventDefault()
      }
    }

    const handleWheel = (e: WheelEvent) => {
      let target = e.target as HTMLElement | null
      let scrollable: HTMLElement | null = null

      while (target && target !== document.body) {
        if (target.nodeType === 1) {
          const isScrollableClass =
            target.classList.contains('popup-scroll-area') ||
            target.classList.contains('substance-popup-scroll') ||
            target.classList.contains('gemot-scroll-area')
          const matchesSelector = scrollableSelector ? target.matches?.(scrollableSelector) : false
          const hasOverflowStyle =
            target.style?.overflowY === 'auto' || target.style?.overflowY === 'scroll'

          if (isScrollableClass || matchesSelector || hasOverflowStyle) {
            scrollable = target
            break
          }
        }
        target = target.parentElement
      }

      if (!scrollable) {
        e.preventDefault()
        return
      }

      const deltaY = e.deltaY
      const scrollTop = scrollable.scrollTop
      const scrollHeight = scrollable.scrollHeight
      const clientHeight = scrollable.clientHeight

      if (deltaY < 0 && scrollTop <= 0) {
        e.preventDefault()
      } else if (deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1) {
        e.preventDefault()
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [isOpen, scrollableSelector])
}
