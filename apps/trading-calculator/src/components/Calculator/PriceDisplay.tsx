'use client'

import type { CurrencyCode, PriceMode } from '@/types'
import { formatBtcPrice, formatRelativeTime } from '@/lib/formatters'
import styles from './Calculator.module.css'

interface PriceDisplayProps {
  price: number
  currency: CurrencyCode
  priceMode: PriceMode
  lastUpdatedAt: number | null
  isStale: boolean
  isLoading: boolean
  onRefresh: () => void
}

export function PriceDisplay({
  price,
  currency,
  priceMode,
  lastUpdatedAt,
  isStale,
  isLoading,
  onRefresh,
}: PriceDisplayProps) {
  const renderPriceModeIcon = () => {
    switch (priceMode) {
      case 'live':
        return <span className={styles.liveDot} />
      case 'frozen':
        return <span className={styles.priceModeEmoji}>❄️</span>
      case 'custom':
        return <span className={styles.priceModeEmoji}>👤</span>
      default:
        return <span className={styles.liveDot} />
    }
  }

  const getPriceModeLabel = () => {
    switch (priceMode) {
      case 'live':
        return 'Live Price'
      case 'frozen':
        return 'Frozen Price'
      case 'custom':
        return 'Your Price'
      default:
        return 'Live Price'
    }
  }

  return (
    <div className={styles.priceDisplay}>
      <div className={styles.priceHeader}>
        <span className={styles.priceModeIndicator}>
          {renderPriceModeIcon()}
          <span className={styles.priceModeLabel}>{getPriceModeLabel()}</span>
        </span>

        {priceMode === 'live' && (
          <button
            type="button"
            className={styles.refreshButton}
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh price"
            title="Refresh price"
          >
            <RefreshIcon spinning={isLoading} />
          </button>
        )}
      </div>

      <div className={styles.priceValue}>
        <span className={styles.priceLabel}>1 BTC =</span>
        <span className={styles.priceAmount}>
          {price > 0 ? formatBtcPrice(price, currency) : '—'}
        </span>
      </div>

      {priceMode === 'live' && lastUpdatedAt && (
        <div className={styles.priceTimestamp}>
          {isStale && (
            <span className={styles.staleWarning} title="Price may be outdated">
              ⚠️
            </span>
          )}
          <span className={isStale ? styles.staleText : ''}>
            Updated {formatRelativeTime(lastUpdatedAt)}
          </span>
        </div>
      )}

      {priceMode === 'live' && (
        <div className={styles.priceSource}>
          source:{' '}
          <a
            href="https://yadio.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            yadio.io
          </a>
        </div>
      )}
    </div>
  )
}

function RefreshIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
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
