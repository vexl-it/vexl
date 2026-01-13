import type { CurrencyCode, BtcOrSat, PriceMode } from '@/types'
import { CURRENCIES } from '@/types'

interface UrlState {
  btcAmount?: string
  fiatAmount?: string
  currency?: CurrencyCode
  btcOrSat?: BtcOrSat
  priceMode?: PriceMode
  frozenPrice?: number
  customPrice?: string
  premium?: number
  shared?: boolean
}

/**
 * Encode calculator state to a URL-safe string
 */
export function encodeState(state: UrlState): string {
  const data = {
    b: state.btcAmount,
    f: state.fiatAmount,
    c: state.currency,
    u: state.btcOrSat,
    m: state.priceMode,
    fp: state.frozenPrice,
    cp: state.customPrice,
    p: state.premium,
  }

  // Remove undefined values
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
  )

  if (Object.keys(cleaned).length === 0) return ''

  // Encode to base64
  const json = JSON.stringify(cleaned)
  return btoa(json)
}

/**
 * Decode URL state string back to state object
 */
export function decodeState(encoded: string): UrlState | null {
  if (!encoded) return null

  try {
    const json = atob(encoded)
    const data = JSON.parse(json)

    return {
      btcAmount: data.b,
      fiatAmount: data.f,
      currency: validateCurrency(data.c),
      btcOrSat: validateBtcOrSat(data.u),
      priceMode: validatePriceMode(data.m),
      frozenPrice: typeof data.fp === 'number' ? data.fp : undefined,
      customPrice: data.cp,
      premium: typeof data.p === 'number' ? data.p : undefined,
      shared: true,
    }
  } catch {
    return null
  }
}

/**
 * Update the URL with current state (debounced)
 */
export function updateUrl(state: UrlState): void {
  if (typeof window === 'undefined') return

  const encoded = encodeState(state)
  const url = new URL(window.location.href)

  if (encoded) {
    url.searchParams.set('s', encoded)
  } else {
    url.searchParams.delete('s')
  }

  // Use replaceState to avoid polluting browser history
  window.history.replaceState({}, '', url.toString())
}

/**
 * Get state from current URL
 */
export function getStateFromUrl(): UrlState | null {
  if (typeof window === 'undefined') return null

  const url = new URL(window.location.href)
  const encoded = url.searchParams.get('s')

  if (!encoded) return null

  return decodeState(encoded)
}

/**
 * Generate a shareable URL with current state
 */
export function generateShareUrl(state: UrlState): string {
  if (typeof window === 'undefined') return ''

  const encoded = encodeState(state)
  const url = new URL(window.location.origin)

  if (encoded) {
    url.searchParams.set('s', encoded)
  }

  return url.toString()
}

/**
 * Validate currency code
 */
function validateCurrency(value: unknown): CurrencyCode | undefined {
  if (typeof value !== 'string') return undefined
  const valid = CURRENCIES.find((c) => c.code === value)
  return valid?.code
}

/**
 * Validate BtcOrSat
 */
function validateBtcOrSat(value: unknown): BtcOrSat | undefined {
  if (value === 'BTC' || value === 'SAT') return value
  return undefined
}

/**
 * Validate PriceMode
 */
function validatePriceMode(value: unknown): PriceMode | undefined {
  if (value === 'live' || value === 'frozen' || value === 'custom') return value
  return undefined
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      return false
    }
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
