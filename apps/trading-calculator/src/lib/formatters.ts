import type { CurrencyCode, BtcOrSat } from '@/types'
import { CURRENCIES, SATOSHIS_PER_BTC } from '@/types'

/**
 * Get the user's locale from the browser
 */
export function getUserLocale(): string {
  if (typeof navigator === 'undefined') return 'en-US'
  return navigator.language || 'en-US'
}

/**
 * Format a number according to the user's locale
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  const locale = getUserLocale()
  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * Format a BTC amount with appropriate precision
 * @param value - Amount in BTC
 * @param btcOrSat - Display unit
 */
export function formatBtcAmount(value: number, btcOrSat: BtcOrSat): string {
  if (btcOrSat === 'SAT') {
    const sats = Math.round(value * SATOSHIS_PER_BTC)
    return formatNumber(sats, { maximumFractionDigits: 0 })
  }

  // For BTC, use up to 8 decimal places but trim trailing zeros
  return formatNumber(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  })
}

/**
 * Format a fiat amount with currency symbol
 */
export function formatFiatAmount(
  value: number,
  currency: CurrencyCode,
  showSymbol: boolean = true
): string {
  const locale = getUserLocale()

  if (showSymbol) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Format BTC price for display
 */
export function formatBtcPrice(price: number, currency: CurrencyCode): string {
  return formatFiatAmount(price, currency)
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number, showSign: boolean = true): string {
  const formatted = formatNumber(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })

  if (showSign && value > 0) {
    return `+${formatted}%`
  }

  return `${formatted}%`
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) {
    return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`
  }

  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  }

  return hours === 1 ? '1 hour ago' : `${hours} hours ago`
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: CurrencyCode) {
  return CURRENCIES.find((c) => c.code === code)
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(code: CurrencyCode): string {
  const info = getCurrencyInfo(code)
  return info?.symbol || code
}

/**
 * Parse a formatted number string back to a number
 * Handles locale-specific formatting (commas, spaces, etc.)
 */
export function parseFormattedNumber(value: string): number {
  if (!value || value.trim() === '') return 0

  // Get the decimal separator for the current locale
  const locale = getUserLocale()
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5)
  const decimalSeparator =
    parts.find((p) => p.type === 'decimal')?.value || '.'

  // Replace the locale decimal separator with a standard period
  let normalized = value

  // Remove all group separators (could be comma, space, period, etc.)
  const groupSeparator = parts.find((p) => p.type === 'group')?.value
  if (groupSeparator) {
    normalized = normalized.split(groupSeparator).join('')
  }

  // Replace locale decimal with standard decimal
  if (decimalSeparator !== '.') {
    normalized = normalized.replace(decimalSeparator, '.')
  }

  // Remove any remaining non-numeric characters except decimal and minus
  normalized = normalized.replace(/[^\d.-]/g, '')

  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format number for input field (remove group separators while typing)
 */
export function formatInputNumber(
  value: string,
  maxDecimals: number = 8
): string {
  if (!value) return ''

  // Allow empty, just decimal point, or just minus
  if (value === '' || value === '.' || value === '-' || value === '-.') {
    return value
  }

  // Split by decimal point
  const parts = value.split('.')

  // Handle integer part
  const integerPart = parts[0] || ''

  // Handle decimal part
  let decimalPart = parts[1]

  // Limit decimal places
  if (decimalPart !== undefined && decimalPart.length > maxDecimals) {
    decimalPart = decimalPart.slice(0, maxDecimals)
  }

  // Reconstruct
  if (decimalPart !== undefined) {
    return `${integerPart}.${decimalPart}`
  }

  return integerPart
}

/**
 * Validate if string is a valid numeric input
 */
export function isValidNumericInput(value: string): boolean {
  if (value === '' || value === '.' || value === '-' || value === '-.') {
    return true
  }

  return /^-?\d*\.?\d*$/.test(value)
}
