'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { CurrencyCode, BtcOrSat, PriceMode, CalculatorState } from '@/types'
import { SATOSHIS_PER_BTC } from '@/types'
import { useBtcPrice } from './useBtcPrice'
import { useCalculatorStorage, detectUserCurrency } from './useLocalStorage'
import {
  btcToFiat,
  fiatToBtc,
  parseNumericInput,
  roundTo,
} from '@/lib/calculations'
import { formatInputNumber, isValidNumericInput } from '@/lib/formatters'
import { getStateFromUrl, updateUrl } from '@/lib/urlState'

interface UseCalculatorResult {
  state: CalculatorState
  // Setters
  setBtcAmount: (value: string) => void
  setFiatAmount: (value: string) => void
  setCurrency: (currency: CurrencyCode) => void
  setBtcOrSat: (unit: BtcOrSat) => void
  setPriceMode: (mode: PriceMode) => void
  setCustomPrice: (price: string) => void
  setPremium: (premium: number) => void
  // Actions
  freezeCurrentPrice: () => void
  switchToLive: () => void
  toggleBtcSat: () => void
  reset: () => void
  refreshPrice: () => Promise<void>
  // Computed
  effectivePrice: number
  isSharedState: boolean
}

const DEBOUNCE_DELAY = 500

export function useCalculator(): UseCalculatorResult {
  const [savedState, updateSavedState] = useCalculatorStorage()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSharedState, setIsSharedState] = useState(false)

  // Core state
  const [btcAmount, setBtcAmountState] = useState('')
  const [fiatAmount, setFiatAmountState] = useState('')
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD')
  const [btcOrSat, setBtcOrSatState] = useState<BtcOrSat>('BTC')
  const [priceMode, setPriceModeState] = useState<PriceMode>('live')
  const [frozenPrice, setFrozenPrice] = useState<number | null>(null)
  const [customPrice, setCustomPriceState] = useState('')
  const [premium, setPremiumState] = useState(0)

  // Track which field was last edited to prevent calculation loops
  const lastEditedField = useRef<'btc' | 'fiat' | null>(null)

  // URL update debounce
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch live price
  const {
    price: livePrice,
    lastUpdatedAt,
    isLoading,
    error,
    isStale,
    refresh: refreshPrice,
  } = useBtcPrice(currency)

  // Calculate effective price based on mode
  const effectivePrice = useMemo(() => {
    switch (priceMode) {
      case 'live':
        return livePrice ?? 0
      case 'frozen':
        return frozenPrice ?? livePrice ?? 0
      case 'custom':
        return parseNumericInput(customPrice) || livePrice || 0
      default:
        return livePrice ?? 0
    }
  }, [priceMode, livePrice, frozenPrice, customPrice])

  // Initialize from URL or localStorage
  useEffect(() => {
    if (isInitialized) return

    const urlState = getStateFromUrl()

    if (urlState) {
      // Load from URL (shared link)
      setIsSharedState(true)
      if (urlState.btcAmount) setBtcAmountState(urlState.btcAmount)
      if (urlState.fiatAmount) setFiatAmountState(urlState.fiatAmount)
      if (urlState.currency) setCurrencyState(urlState.currency)
      if (urlState.btcOrSat) setBtcOrSatState(urlState.btcOrSat)
      if (urlState.priceMode) setPriceModeState(urlState.priceMode)
      if (urlState.frozenPrice) setFrozenPrice(urlState.frozenPrice)
      if (urlState.customPrice) setCustomPriceState(urlState.customPrice)
      if (urlState.premium !== undefined) setPremiumState(urlState.premium)
    } else {
      // Load from localStorage
      const detectedCurrency = detectUserCurrency()
      setCurrencyState(savedState.currency || detectedCurrency)
      setBtcOrSatState(savedState.btcOrSat || 'BTC')
      setPriceModeState(savedState.priceMode || 'live')
      setFrozenPrice(savedState.frozenPrice)
      setCustomPriceState(savedState.customPrice || '')
      setPremiumState(savedState.premium || 0)
    }

    setIsInitialized(true)
  }, [isInitialized, savedState])

  // Convert BTC input to actual BTC value (handling SAT)
  const getBtcValue = useCallback(
    (inputValue: string): number => {
      const value = parseNumericInput(inputValue)
      if (btcOrSat === 'SAT') {
        return value / SATOSHIS_PER_BTC
      }
      return value
    },
    [btcOrSat]
  )

  // Convert BTC value to display format (handling SAT)
  const formatBtcForDisplay = useCallback(
    (btcValue: number): string => {
      if (btcOrSat === 'SAT') {
        const sats = Math.round(btcValue * SATOSHIS_PER_BTC)
        return sats.toString()
      }
      return roundTo(btcValue, 8).toString()
    },
    [btcOrSat]
  )

  // Update URL with debounce
  const updateUrlDebounced = useCallback(() => {
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current)
    }

    urlUpdateTimeoutRef.current = setTimeout(() => {
      updateUrl({
        btcAmount: btcAmount || undefined,
        fiatAmount: fiatAmount || undefined,
        currency,
        btcOrSat,
        priceMode,
        frozenPrice: frozenPrice ?? undefined,
        customPrice: customPrice || undefined,
        premium,
      })
    }, DEBOUNCE_DELAY)
  }, [btcAmount, fiatAmount, currency, btcOrSat, priceMode, frozenPrice, customPrice, premium])

  // Save to localStorage and update URL when state changes
  useEffect(() => {
    if (!isInitialized) return

    updateSavedState({
      currency,
      btcOrSat,
      priceMode,
      frozenPrice,
      customPrice,
      premium,
    })

    updateUrlDebounced()
  }, [
    isInitialized,
    currency,
    btcOrSat,
    priceMode,
    frozenPrice,
    customPrice,
    premium,
    updateSavedState,
    updateUrlDebounced,
  ])

  // Calculate fiat when BTC changes
  const setBtcAmount = useCallback(
    (value: string) => {
      if (!isValidNumericInput(value)) return

      const formatted = formatInputNumber(value, btcOrSat === 'SAT' ? 0 : 8)
      setBtcAmountState(formatted)
      lastEditedField.current = 'btc'

      if (effectivePrice > 0 && formatted) {
        const btcValue = getBtcValue(formatted)
        const fiat = btcToFiat(btcValue, effectivePrice, premium)
        setFiatAmountState(roundTo(fiat, 2).toString())
      } else if (!formatted) {
        setFiatAmountState('')
      }
    },
    [btcOrSat, effectivePrice, premium, getBtcValue]
  )

  // Calculate BTC when fiat changes
  const setFiatAmount = useCallback(
    (value: string) => {
      if (!isValidNumericInput(value)) return

      const formatted = formatInputNumber(value, 2)
      setFiatAmountState(formatted)
      lastEditedField.current = 'fiat'

      if (effectivePrice > 0 && formatted) {
        const fiatValue = parseNumericInput(formatted)
        const btc = fiatToBtc(fiatValue, effectivePrice, premium)
        setBtcAmountState(formatBtcForDisplay(btc))
      } else if (!formatted) {
        setBtcAmountState('')
      }
    },
    [effectivePrice, premium, formatBtcForDisplay]
  )

  // Recalculate when price or premium changes
  useEffect(() => {
    if (!isInitialized || effectivePrice <= 0) return

    if (lastEditedField.current === 'btc' && btcAmount) {
      const btcValue = getBtcValue(btcAmount)
      const fiat = btcToFiat(btcValue, effectivePrice, premium)
      setFiatAmountState(roundTo(fiat, 2).toString())
    } else if (lastEditedField.current === 'fiat' && fiatAmount) {
      const fiatValue = parseNumericInput(fiatAmount)
      const btc = fiatToBtc(fiatValue, effectivePrice, premium)
      setBtcAmountState(formatBtcForDisplay(btc))
    }
  }, [
    isInitialized,
    effectivePrice,
    premium,
    btcAmount,
    fiatAmount,
    getBtcValue,
    formatBtcForDisplay,
  ])

  // Currency setter
  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency)
    // Price will auto-refresh via useBtcPrice when currency changes
  }, [])

  // BTC/SAT toggle
  const setBtcOrSat = useCallback(
    (unit: BtcOrSat) => {
      if (unit === btcOrSat) return

      // Convert current value to new unit
      if (btcAmount) {
        const currentBtcValue = getBtcValue(btcAmount)
        setBtcOrSatState(unit)

        if (unit === 'SAT') {
          const sats = Math.round(currentBtcValue * SATOSHIS_PER_BTC)
          setBtcAmountState(sats.toString())
        } else {
          setBtcAmountState(roundTo(currentBtcValue, 8).toString())
        }
      } else {
        setBtcOrSatState(unit)
      }
    },
    [btcOrSat, btcAmount, getBtcValue]
  )

  const toggleBtcSat = useCallback(() => {
    setBtcOrSat(btcOrSat === 'BTC' ? 'SAT' : 'BTC')
  }, [btcOrSat, setBtcOrSat])

  // Price mode setter
  const setPriceMode = useCallback((mode: PriceMode) => {
    setPriceModeState(mode)
  }, [])

  // Custom price setter
  const setCustomPrice = useCallback((price: string) => {
    if (!isValidNumericInput(price)) return
    const formatted = formatInputNumber(price, 2)
    setCustomPriceState(formatted)
  }, [])

  // Premium setter
  const setPremium = useCallback((value: number) => {
    // Clamp between -99 and 1000
    const clamped = Math.max(-99, Math.min(1000, value))
    setPremiumState(clamped)
  }, [])

  // Freeze current price
  const freezeCurrentPrice = useCallback(() => {
    if (livePrice) {
      setFrozenPrice(livePrice)
      setPriceModeState('frozen')
    }
  }, [livePrice])

  // Switch to live price
  const switchToLive = useCallback(() => {
    setPriceModeState('live')
  }, [])

  // Reset calculator
  const reset = useCallback(() => {
    setBtcAmountState('')
    setFiatAmountState('')
    setPremiumState(0)
    setPriceModeState('live')
    lastEditedField.current = null
    setIsSharedState(false)

    // Clear URL params
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Build state object
  const state: CalculatorState = {
    btcAmount,
    fiatAmount,
    currency,
    btcOrSat,
    priceMode,
    livePrice,
    frozenPrice,
    customPrice,
    premium,
    lastUpdatedAt,
    isLoading,
    error,
    isStale,
  }

  return {
    state,
    setBtcAmount,
    setFiatAmount,
    setCurrency,
    setBtcOrSat,
    setPriceMode,
    setCustomPrice,
    setPremium,
    freezeCurrentPrice,
    switchToLive,
    toggleBtcSat,
    reset,
    refreshPrice,
    effectivePrice,
    isSharedState,
  }
}
