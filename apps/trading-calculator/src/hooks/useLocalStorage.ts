'use client'

import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        const parsed = JSON.parse(item)
        setStoredValue(parsed)
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }

    setIsInitialized(true)
  }, [key])

  // Save to localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Use functional update to avoid dependency on storedValue
        setStoredValue((prevValue) => {
          const valueToStore =
            value instanceof Function ? value(prevValue) : value

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
          }

          return valueToStore
        })
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key]
  )

  // Return initialized value or initial value
  return [isInitialized ? storedValue : initialValue, setValue]
}

// Specific hook for calculator saved state
import type { SavedState, CurrencyCode } from '@/types'

const STORAGE_KEY = 'vexl-calculator-state'

const DEFAULT_SAVED_STATE: SavedState = {
  currency: 'USD',
  priceMode: 'live',
  frozenPrice: null,
  customPrice: '',
  premium: 0,
  btcOrSat: 'BTC',
}

export function useCalculatorStorage(): [
  SavedState,
  (state: Partial<SavedState>) => void,
] {
  const [state, setState] = useLocalStorage<SavedState>(
    STORAGE_KEY,
    DEFAULT_SAVED_STATE
  )

  const updateState = useCallback(
    (partial: Partial<SavedState>) => {
      setState((prev) => ({ ...prev, ...partial }))
    },
    [setState]
  )

  return [state, updateState]
}

/**
 * Detect user's preferred currency from browser locale
 */
export function detectUserCurrency(): CurrencyCode {
  if (typeof navigator === 'undefined') return 'USD'

  const locale = navigator.language || 'en-US'

  // Map common locales to currencies
  const localeCurrencyMap: Record<string, CurrencyCode> = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'en-AU': 'AUD',
    'en-CA': 'CAD',
    'de-DE': 'EUR',
    'de-AT': 'EUR',
    'fr-FR': 'EUR',
    'es-ES': 'EUR',
    'it-IT': 'EUR',
    'nl-NL': 'EUR',
    'pt-PT': 'EUR',
    'cs-CZ': 'CZK',
    'pl-PL': 'PLN',
    'hu-HU': 'HUF',
    'ro-RO': 'RON',
    'bg-BG': 'BGN',
    'hr-HR': 'HRK',
    'sv-SE': 'SEK',
    'nb-NO': 'NOK',
    'da-DK': 'DKK',
    'ja-JP': 'JPY',
    'zh-CN': 'CNY',
    'hi-IN': 'INR',
    'pt-BR': 'BRL',
    'es-MX': 'MXN',
  }

  // Try exact match
  if (localeCurrencyMap[locale]) {
    return localeCurrencyMap[locale]
  }

  // Try language only match
  const language = locale.split('-')[0]
  const languageCurrencyMap: Record<string, CurrencyCode> = {
    en: 'USD',
    de: 'EUR',
    fr: 'EUR',
    es: 'EUR',
    it: 'EUR',
    nl: 'EUR',
    pt: 'EUR',
    cs: 'CZK',
    pl: 'PLN',
    hu: 'HUF',
    ro: 'RON',
    bg: 'BGN',
    hr: 'HRK',
    sv: 'SEK',
    nb: 'NOK',
    no: 'NOK',
    da: 'DKK',
    ja: 'JPY',
    zh: 'CNY',
    hi: 'INR',
  }

  return languageCurrencyMap[language ?? ''] || 'USD'
}
