import { SATOSHIS_PER_BTC } from '@/types'

/**
 * Convert BTC to Satoshis
 */
export function btcToSat(btc: number): number {
  return Math.round(btc * SATOSHIS_PER_BTC)
}

/**
 * Convert Satoshis to BTC
 */
export function satToBtc(sat: number): number {
  return sat / SATOSHIS_PER_BTC
}

/**
 * Calculate fiat amount from BTC
 * @param btcAmount - Amount in BTC
 * @param btcPrice - Price of 1 BTC in fiat
 * @param premium - Premium/discount percentage (e.g., 5 for +5%, -5 for -5%)
 */
export function btcToFiat(
  btcAmount: number,
  btcPrice: number,
  premium: number = 0
): number {
  const baseFiat = btcAmount * btcPrice
  return applyPremium(baseFiat, premium)
}

/**
 * Calculate BTC amount from fiat
 * @param fiatAmount - Amount in fiat currency
 * @param btcPrice - Price of 1 BTC in fiat
 * @param premium - Premium/discount percentage
 */
export function fiatToBtc(
  fiatAmount: number,
  btcPrice: number,
  premium: number = 0
): number {
  const adjustedFiat = cancelPremium(fiatAmount, premium)
  return adjustedFiat / btcPrice
}

/**
 * Apply premium/discount to a value
 * @param value - Base value
 * @param premium - Percentage to apply (positive = premium, negative = discount)
 */
export function applyPremium(value: number, premium: number): number {
  return value * (1 + premium / 100)
}

/**
 * Cancel/reverse premium from a value
 * @param value - Value with premium applied
 * @param premium - Percentage that was applied
 */
export function cancelPremium(value: number, premium: number): number {
  return value / (1 + premium / 100)
}

/**
 * Calculate the effective price with premium
 * @param basePrice - Base BTC price
 * @param premium - Premium/discount percentage
 */
export function getEffectivePrice(basePrice: number, premium: number): number {
  return applyPremium(basePrice, premium)
}

/**
 * Calculate the percentage difference between two prices
 * @param customPrice - User's custom price
 * @param livePrice - Current live price
 */
export function getPriceDifference(
  customPrice: number,
  livePrice: number
): number {
  if (livePrice === 0) return 0
  return ((customPrice - livePrice) / livePrice) * 100
}

/**
 * Parse a numeric string, handling various formats
 */
export function parseNumericInput(value: string): number {
  if (!value || value === '') return 0

  // Remove all non-numeric characters except decimal point and minus
  const cleaned = value.replace(/[^\d.-]/g, '')

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Validate BTC amount (max 21 million)
 */
export function isValidBtcAmount(btc: number): boolean {
  return btc >= 0 && btc <= 21_000_000
}

/**
 * Validate Satoshi amount (max 21 million * 100 million)
 */
export function isValidSatAmount(sat: number): boolean {
  return sat >= 0 && sat <= 21_000_000 * SATOSHIS_PER_BTC
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
