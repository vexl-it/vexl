'use client'

import type { CurrencyCode } from '@/types'
import { getCurrencySymbol } from '@/lib/formatters'
import styles from './Calculator.module.css'

interface FiatAmountInputProps {
  value: string
  onChange: (value: string) => void
  currency: CurrencyCode
  onCurrencyChange: (currency: CurrencyCode) => void
  isLoading?: boolean
  disabled?: boolean
}

export function FiatAmountInput({
  value,
  onChange,
  currency,
  onCurrencyChange,
  isLoading = false,
  disabled = false,
}: FiatAmountInputProps) {
  return (
    <div className={styles.inputGroup}>
      <div className={styles.inputHeader}>
        <label htmlFor="fiat-amount" className={styles.inputLabel}>
          {currency} Amount
        </label>
        <CurrencySelector
          value={currency}
          onChange={onCurrencyChange}
          disabled={disabled}
        />
      </div>
      <div className={styles.inputWrapper}>
        <span className={styles.inputPrefix}>
          {getCurrencySymbol(currency)}
        </span>
        <input
          id="fiat-amount"
          type="text"
          inputMode="decimal"
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          disabled={disabled || isLoading}
          autoComplete="off"
        />
        {isLoading && <span className={styles.loadingIndicator}>...</span>}
      </div>
    </div>
  )
}

interface CurrencySelectorProps {
  value: CurrencyCode
  onChange: (currency: CurrencyCode) => void
  disabled?: boolean
}

import { CURRENCIES } from '@/types'

function CurrencySelector({
  value,
  onChange,
  disabled = false,
}: CurrencySelectorProps) {
  return (
    <select
      className={styles.currencySelect}
      value={value}
      onChange={(e) => onChange(e.target.value as CurrencyCode)}
      disabled={disabled}
      aria-label="Select currency"
    >
      {CURRENCIES.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.code}
        </option>
      ))}
    </select>
  )
}
