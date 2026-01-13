'use client'

import { useState, useEffect } from 'react'
import { useCalculator } from '@/hooks/useCalculator'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice'
import { BtcAmountInput } from './BtcAmountInput'
import { FiatAmountInput } from './FiatAmountInput'
import { PriceHeader } from './PriceHeader'
import { PremiumSlider } from './PremiumSlider'
import { ShareButton, CopyResultButton } from './ShareButton'
import { Toggle } from './Toggle'
import styles from './Calculator.module.css'

export function Calculator() {
  const {
    state,
    setBtcAmount,
    setFiatAmount,
    setCurrency,
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
  } = useCalculator()

  const isTouchDevice = useIsTouchDevice()

  // Premium toggle - enabled if premium is non-zero
  const [isPremiumEnabled, setIsPremiumEnabled] = useState(state.premium !== 0)

  // Sync toggle state with premium value
  useEffect(() => {
    if (state.premium !== 0 && !isPremiumEnabled) {
      setIsPremiumEnabled(true)
    }
  }, [state.premium, isPremiumEnabled])

  // Handle toggle change
  const handlePremiumToggle = (enabled: boolean) => {
    setIsPremiumEnabled(enabled)
    if (!enabled) {
      setPremium(0)
    }
  }

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    onSwitchToLive: switchToLive,
    onFreezePrice: freezeCurrentPrice,
    onSwapBtcSat: toggleBtcSat,
    onReset: reset,
  })

  return (
    <div className={styles.calculator}>
      {isSharedState && (
        <div className={styles.sharedBanner}>
          <span>📤 Viewing shared calculation</span>
          <button type="button" onClick={reset}>
            Reset
          </button>
        </div>
      )}

      <PriceHeader
        price={effectivePrice}
        currency={state.currency}
        priceMode={state.priceMode}
        lastUpdatedAt={state.lastUpdatedAt}
        isStale={state.isStale}
        isLoading={state.isLoading}
        onRefresh={refreshPrice}
        livePrice={state.livePrice}
        frozenPrice={state.frozenPrice}
        customPrice={state.customPrice}
        onPriceModeChange={setPriceMode}
        onCustomPriceChange={setCustomPrice}
        onFreezePrice={freezeCurrentPrice}
      />

      <BtcAmountInput
        value={state.btcAmount}
        onChange={setBtcAmount}
        btcOrSat={state.btcOrSat}
        onToggleBtcSat={toggleBtcSat}
      />

      <FiatAmountInput
        value={state.fiatAmount}
        onChange={setFiatAmount}
        currency={state.currency}
        onCurrencyChange={setCurrency}
        isLoading={state.isLoading}
      />

      <div className={styles.divider} />

      <div className={styles.premiumToggleRow}>
        <Toggle
          label="% Premium or Discount"
          checked={isPremiumEnabled}
          onChange={handlePremiumToggle}
        />
      </div>

      <div
        className={`${styles.premiumContent} ${
          isPremiumEnabled
            ? styles.premiumContentVisible
            : styles.premiumContentHidden
        }`}
      >
        <PremiumSlider
          value={state.premium}
          onChange={setPremium}
          disabled={!isPremiumEnabled}
        />
      </div>

      <div className={styles.actionButtons}>
        <CopyResultButton
          btcAmount={state.btcAmount}
          fiatAmount={state.fiatAmount}
          currency={state.currency}
          btcOrSat={state.btcOrSat}
        />
        <ShareButton
          btcAmount={state.btcAmount}
          fiatAmount={state.fiatAmount}
          currency={state.currency}
          btcOrSat={state.btcOrSat}
          priceMode={state.priceMode}
          frozenPrice={state.frozenPrice}
          customPrice={state.customPrice}
          premium={state.premium}
        />
      </div>

      <button type="button" className={styles.resetButton} onClick={reset}>
        Reset Calculator{!isTouchDevice && ' (Esc)'}
      </button>
    </div>
  )
}
