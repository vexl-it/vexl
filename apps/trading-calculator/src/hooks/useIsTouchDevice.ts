'use client'

import { useState, useEffect } from 'react'

export function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
          navigator.maxTouchPoints > 0 ||
          window.matchMedia('(pointer: coarse)').matches
      )
    }

    checkTouch()

    // Also listen for media query changes
    const mediaQuery = window.matchMedia('(pointer: coarse)')
    const handleChange = () => checkTouch()
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return isTouchDevice
}
