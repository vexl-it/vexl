'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcuts {
  onSwitchToLive?: () => void
  onFreezePrice?: () => void
  onSwapBtcSat?: () => void
  onReset?: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only handle Escape in input fields
        if (event.key === 'Escape') {
          ;(target as HTMLInputElement).blur()
        }
        return
      }

      // Don't trigger with modifier keys (except for specific combinations)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      switch (event.key.toLowerCase()) {
        case 'l':
          event.preventDefault()
          shortcuts.onSwitchToLive?.()
          break
        case 'f':
          event.preventDefault()
          shortcuts.onFreezePrice?.()
          break
        case 's':
          event.preventDefault()
          shortcuts.onSwapBtcSat?.()
          break
        case 'escape':
          event.preventDefault()
          shortcuts.onReset?.()
          break
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

// Keyboard shortcut hints for tooltips
export const KEYBOARD_SHORTCUTS = [
  { key: 'L', description: 'Switch to live price' },
  { key: 'F', description: 'Freeze current price' },
  { key: 'S', description: 'Swap BTC/SAT' },
  { key: 'Esc', description: 'Reset calculator' },
] as const
