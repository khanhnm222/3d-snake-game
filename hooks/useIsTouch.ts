'use client'
import { useState, useEffect } from 'react'

const QUERY = '(pointer: coarse)'

/** True on touch-first devices (phones / tablets) — drives touch controls and render quality */
export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(QUERY).matches
  })
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent) => setTouch(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return touch
}