'use client'

import type { BtcOrSat } from '@/types'
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice'
import styles from './Calculator.module.css'

interface BtcAmountInputProps {
  value: string
  onChange: (value: string) => void
  btcOrSat: BtcOrSat
  onToggleBtcSat: () => void
  disabled?: boolean
}

export function BtcAmountInput({
  value,
  onChange,
  btcOrSat,
  onToggleBtcSat,
  disabled = false,
}: BtcAmountInputProps) {
  const isTouchDevice = useIsTouchDevice()

  return (
    <div className={styles.inputGroup}>
      <div className={styles.inputHeader}>
        <label htmlFor="btc-amount" className={styles.inputLabel}>
          {btcOrSat === 'BTC' ? 'BTC' : 'SAT'} Amount
        </label>
        <button
          type="button"
          className={styles.unitToggle}
          onClick={onToggleBtcSat}
          title={isTouchDevice ? undefined : "Press 'S' to toggle"}
          aria-label={`Switch to ${btcOrSat === 'BTC' ? 'Satoshis' : 'Bitcoin'}`}
        >
          {btcOrSat === 'BTC' ? 'SAT' : 'BTC'}
        </button>
      </div>
      <div className={styles.inputWrapper}>
        <input
          id="btc-amount"
          type="text"
          inputMode="decimal"
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={btcOrSat === 'BTC' ? '0.00000000' : '0'}
          disabled={disabled}
          autoComplete="off"
        />
        <span className={styles.inputSuffix}>
          {btcOrSat === 'BTC' ? '₿' : 'sats'}
        </span>
      </div>
    </div>
  )
}
