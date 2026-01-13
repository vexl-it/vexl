'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CurrencyCode } from '@/types'

interface UseBtcPriceResult {
  price: number | null
  lastUpdatedAt: number | null
  isLoading: boolean
  error: string | null
  isStale: boolean
  refresh: () => Promise<void>
}

const REFRESH_INTERVAL = 30_000 // 30 seconds
const STALE_THRESHOLD = 60_000 // 60 seconds

export function useBtcPrice(currency: CurrencyCode): UseBtcPriceResult {
  const [price, setPrice] = useState<number | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const staleCheckRef = useRef<NodeJS.Timeout | null>(null)

  const fetchPrice = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/btc-price?currency=${currency}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch price')
      }

      setPrice(data.BTC)
      setLastUpdatedAt(data.lastUpdatedAt || Date.now())
      setIsStale(false)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch price'
      setError(errorMessage)

      // Don't clear price on error - keep showing cached value
      if (price !== null) {
        setIsStale(true)
      }
    } finally {
      setIsLoading(false)
    }
  }, [currency, price])

  // Check for staleness
  useEffect(() => {
    const checkStale = () => {
      if (lastUpdatedAt) {
        const now = Date.now()
        const timeSinceUpdate = now - lastUpdatedAt
        setIsStale(timeSinceUpdate > STALE_THRESHOLD)
      }
    }

    // Check immediately
    checkStale()

    // Check every 10 seconds
    staleCheckRef.current = setInterval(checkStale, 10_000)

    return () => {
      if (staleCheckRef.current) {
        clearInterval(staleCheckRef.current)
      }
    }
  }, [lastUpdatedAt])

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchPrice()

    // Set up auto-refresh
    intervalRef.current = setInterval(fetchPrice, REFRESH_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchPrice])

  // Refetch when currency changes
  useEffect(() => {
    setPrice(null)
    setLastUpdatedAt(null)
    setIsStale(false)
    fetchPrice()
  }, [currency]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    price,
    lastUpdatedAt,
    isLoading,
    error,
    isStale,
    refresh: fetchPrice,
  }
}
