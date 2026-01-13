'use client'

import type { PriceMode, CurrencyCode } from '@/types'
import { parseNumericInput, getPriceDifference } from '@/lib/calculations'
import { formatPercentage } from '@/lib/formatters'
import styles from './Calculator.module.css'

interface PriceModeSelectorProps {
  priceMode: PriceMode
  onPriceModeChange: (mode: PriceMode) => void
  livePrice: number | null
  frozenPrice: number | null
  customPrice: string
  onCustomPriceChange: (price: string) => void
  onFreezePrice: () => void
  currency: CurrencyCode
  disabled?: boolean
}

export function PriceModeSelector({
  priceMode,
  onPriceModeChange,
  livePrice,
  customPrice,
  onCustomPriceChange,
  onFreezePrice,
  currency,
  disabled = false,
}: PriceModeSelectorProps) {
  const handleFreezePrice = () => {
    if (livePrice) {
      onFreezePrice()
    }
  }

  const customPriceNumber = parseNumericInput(customPrice)
  const priceDifference =
    livePrice && customPriceNumber
      ? getPriceDifference(customPriceNumber, livePrice)
      : null

  return (
    <div className={styles.priceModeButtons}>
      <button
        type="button"
        className={`${styles.priceModeBtn} ${priceMode === 'live' ? styles.priceModeActive : ''}`}
        onClick={() => onPriceModeChange('live')}
        disabled={disabled}
      >
        <span className={styles.liveDotSmall} />
        Market Price
      </button>

      <button
        type="button"
        className={`${styles.priceModeBtn} ${priceMode === 'frozen' ? styles.priceModeActive : ''}`}
        onClick={handleFreezePrice}
        disabled={disabled || !livePrice}
      >
        <span className={styles.priceModeEmojiSmall}>❄️</span>
        Freeze Current Price
      </button>

      <button
        type="button"
        className={`${styles.priceModeBtn} ${priceMode === 'custom' ? styles.priceModeActive : ''}`}
        onClick={() => onPriceModeChange('custom')}
        disabled={disabled}
      >
        <span className={styles.priceModeEmojiSmall}>👤</span>
        Your Price
      </button>

      {priceMode === 'custom' && (
        <div className={styles.customPriceInputRow}>
          <span className={styles.customPriceLabel}>1 BTC =</span>
          <input
            type="text"
            inputMode="decimal"
            className={styles.customPriceField}
            value={customPrice}
            onChange={(e) => onCustomPriceChange(e.target.value)}
            placeholder="Enter price"
            disabled={disabled}
            autoFocus
          />
          <span className={styles.customPriceCurrency}>{currency}</span>
          {priceDifference !== null && (
            <span
              className={`${styles.priceDifference} ${priceDifference >= 0 ? styles.priceDifferencePositive : styles.priceDifferenceNegative}`}
            >
              {formatPercentage(priceDifference)} vs market
            </span>
          )}
        </div>
      )}
    </div>
  )
}
