'use client'

import { useState } from 'react'
import type { CurrencyCode, PriceMode } from '@/types'
import { formatBtcPrice, formatRelativeTime } from '@/lib/formatters'
import { PriceModeSelector } from './PriceModeSelector'
import styles from './Calculator.module.css'

interface PriceHeaderProps {
  price: number
  currency: CurrencyCode
  priceMode: PriceMode
  lastUpdatedAt: number | null
  isStale: boolean
  isLoading: boolean
  onRefresh: () => void
  livePrice: number | null
  frozenPrice: number | null
  customPrice: string
  onPriceModeChange: (mode: PriceMode) => void
  onCustomPriceChange: (price: string) => void
  onFreezePrice: () => void
}

export function PriceHeader({
  price,
  currency,
  priceMode,
  lastUpdatedAt,
  isStale,
  isLoading,
  onRefresh,
  livePrice,
  frozenPrice,
  customPrice,
  onPriceModeChange,
  onCustomPriceChange,
  onFreezePrice,
}: PriceHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getPriceModeLabel = () => {
    switch (priceMode) {
      case 'live':
        return 'Market Price'
      case 'frozen':
        return 'Frozen Price'
      case 'custom':
        return 'Your Price'
      default:
        return 'Market Price'
    }
  }

  return (
    <div className={styles.priceHeaderContainer}>
      <button
        type="button"
        className={styles.priceHeaderButton}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className={styles.priceHeaderTextWrapper}>
          <span className={styles.priceHeaderLabel}>{getPriceModeLabel()}</span>
          <span className={styles.priceHeaderText}>
            1 BTC = {price > 0 ? formatBtcPrice(price, currency) : '—'}
          </span>
        </div>
        <ChevronIcon expanded={isExpanded} />
      </button>

      <div
        className={`${styles.priceHeaderContent} ${
          isExpanded
            ? styles.priceHeaderContentVisible
            : styles.priceHeaderContentHidden
        }`}
      >
        <div className={styles.priceHeaderDetails}>
          {priceMode === 'live' && lastUpdatedAt && (
            <div className={styles.priceTimestampInline}>
              {isStale && (
                <span className={styles.staleWarning} title="Price may be outdated">
                  ⚠️
                </span>
              )}
              <span className={isStale ? styles.staleText : ''}>
                Updated {formatRelativeTime(lastUpdatedAt)}
              </span>
              <button
                type="button"
                className={styles.refreshButtonSmall}
                onClick={(e) => {
                  e.stopPropagation()
                  onRefresh()
                }}
                disabled={isLoading}
                aria-label="Refresh price"
              >
                <RefreshIcon spinning={isLoading} />
              </button>
            </div>
          )}

          {priceMode === 'live' && (
            <div className={styles.priceSource}>
              source:{' '}
              <a
                href="https://yadio.io"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                yadio.io
              </a>
            </div>
          )}

          <PriceModeSelector
            priceMode={priceMode}
            onPriceModeChange={onPriceModeChange}
            livePrice={livePrice}
            frozenPrice={frozenPrice}
            customPrice={customPrice}
            onCustomPriceChange={onCustomPriceChange}
            onFreezePrice={onFreezePrice}
            currency={currency}
          />
        </div>
      </div>
    </div>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${styles.chevronIcon} ${expanded ? styles.chevronExpanded : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function RefreshIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? styles.spinning : ''}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  )
}
