export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CHF'
  | 'CZK'
  | 'PLN'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'CNY'
  | 'INR'
  | 'BRL'
  | 'MXN'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'HUF'
  | 'RON'
  | 'BGN'
  | 'HRK'

export type BtcOrSat = 'BTC' | 'SAT'

export type PriceMode = 'live' | 'frozen' | 'custom'

export interface BtcPriceResponse {
  BTC: number
  lastUpdatedAt: number | null
}

export interface CalculatorState {
  btcAmount: string
  fiatAmount: string
  currency: CurrencyCode
  btcOrSat: BtcOrSat
  priceMode: PriceMode
  livePrice: number | null
  frozenPrice: number | null
  customPrice: string
  premium: number
  lastUpdatedAt: number | null
  isLoading: boolean
  error: string | null
  isStale: boolean
}

export interface SavedState {
  currency: CurrencyCode
  priceMode: PriceMode
  frozenPrice: number | null
  customPrice: string
  premium: number
  btcOrSat: BtcOrSat
}

export interface CurrencyInfo {
  code: CurrencyCode
  symbol: string
  name: string
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
]

export const SATOSHIS_PER_BTC = 100_000_000

export const PREMIUM_PRESETS = [-10, -5, 0, 5, 10, 15, 20]
