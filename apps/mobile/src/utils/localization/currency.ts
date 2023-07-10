import {bigNumberToString} from '../bigNumberToString'
import {
  type CurrencyCode,
  CurrencyInfo,
} from '@vexl-next/domain/dist/general/currency.brand'

const currencies = {
  'AED': CurrencyInfo.parse({
    code: 'AED',
    flag: '🇦🇪',
    name: 'درهم إماراتي',
    symbol: 'د.إ',
    position: 'before',
  }),
  'AUD': CurrencyInfo.parse({
    code: 'AUD',
    flag: '🇦🇺',
    name: 'Australian dollar',
    symbol: 'AU$',
    position: 'before',
  }),
  'BGN': CurrencyInfo.parse({
    code: 'BGN',
    flag: '🇧🇬',
    name: 'Български лев',
    symbol: 'лв',
    position: 'after',
  }),
  'BRL': CurrencyInfo.parse({
    code: 'BRL',
    flag: '🇧🇷',
    name: 'Real brasileiro',
    symbol: 'R$',
    position: 'before',
  }),
  'CAD': CurrencyInfo.parse({
    code: 'CAD',
    flag: '🇨🇦',
    name: 'Canadian dollar',
    symbol: 'CA$',
    position: 'before',
  }),
  'CHF': CurrencyInfo.parse({
    code: 'CHF',
    flag: '🇨🇭',
    name: 'Schweizer Franken',
    symbol: 'Fr',
    position: 'before',
  }),
  'CLP': CurrencyInfo.parse({
    code: 'CLP',
    flag: '🇨🇱',
    name: 'Peso chileno',
    symbol: 'CLP$',
    position: 'before',
  }),
  'CNY': CurrencyInfo.parse({
    code: 'CNY',
    flag: '🇨🇳',
    name: '人民币',
    symbol: '¥',
    position: 'before',
  }),
  'CZK': CurrencyInfo.parse({
    code: 'CZK',
    flag: '🇨🇿',
    name: 'Koruna česká',
    symbol: 'Kč',
    position: 'after',
  }),
  'DKK': CurrencyInfo.parse({
    code: 'DKK',
    flag: '🇩🇰',
    name: 'Danske kroner',
    symbol: 'kr',
    position: 'before',
  }),
  'EUR': CurrencyInfo.parse({
    code: 'EUR',
    flag: '🇪🇺',
    name: 'Euro',
    symbol: '€',
    position: 'before',
  }),
  'GBP': CurrencyInfo.parse({
    code: 'GBP',
    flag: '🇬🇧',
    name: 'British pound',
    symbol: '£',
    position: 'before',
  }),
  'HKD': CurrencyInfo.parse({
    code: 'HKD',
    flag: '🇭🇰',
    name: '港幣',
    symbol: 'HK$',
    position: 'before',
  }),
  'HUF': CurrencyInfo.parse({
    code: 'HUF',
    flag: '🇭🇺',
    name: 'Magyar forint',
    symbol: 'Ft',
    position: 'after',
  }),
  'IDR': CurrencyInfo.parse({
    code: 'IDR',
    flag: '🇮🇩',
    name: 'Rupiah',
    symbol: 'Rp',
    position: 'before',
  }),
  'ILS': CurrencyInfo.parse({
    code: 'ILS',
    flag: '🇮🇱',
    name: 'שקל חדש',
    symbol: '₪',
    position: 'before',
  }),
  'INR': CurrencyInfo.parse({
    code: 'INR',
    flag: '🇮🇳',
    name: 'Indian rupee',
    symbol: '₹',
    position: 'before',
  }),
  'JPY': CurrencyInfo.parse({
    code: 'JPY',
    flag: '🇯🇵',
    name: '日本円',
    symbol: '¥',
    position: 'before',
  }),
  'KRW': CurrencyInfo.parse({
    code: 'KRW',
    flag: '🇰🇷',
    name: '대한민국 원',
    symbol: '₩',
    position: 'before',
  }),
  'MXN': CurrencyInfo.parse({
    code: 'MXN',
    flag: '🇲🇽',
    name: 'Peso mexicano',
    symbol: 'Mex$',
    position: 'before',
  }),
  'NOK': CurrencyInfo.parse({
    code: 'NOK',
    flag: '🇳🇴',
    name: 'Norske kroner',
    symbol: 'kr',
    position: 'before',
  }),
  'NZD': CurrencyInfo.parse({
    code: 'NZD',
    flag: '🇳🇿',
    name: 'New Zealand dollar',
    symbol: 'NZ$',
    position: 'before',
  }),
  'PLN': CurrencyInfo.parse({
    code: 'PLN',
    flag: '🇵🇱',
    name: 'Złoty',
    symbol: 'zł',
    position: 'after',
  }),
  'RON': CurrencyInfo.parse({
    code: 'RON',
    flag: '🇷🇴',
    name: 'Leu românesc',
    symbol: 'lei',
    position: 'after',
  }),
  'RSD': CurrencyInfo.parse({
    code: 'RSD',
    flag: '🇷🇸',
    name: 'Српски динар',
    symbol: 'дин.',
    position: 'after',
  }),
  'RUB': CurrencyInfo.parse({
    code: 'RUB',
    flag: '🇷🇺',
    name: 'Российский рубль',
    symbol: '₽',
    position: 'after',
  }),
  'SAR': CurrencyInfo.parse({
    code: 'SAR',
    flag: '🇸🇦',
    name: 'ريال سعودي',
    symbol: 'ر.س',
    position: 'before',
  }),
  'SEK': CurrencyInfo.parse({
    code: 'SEK',
    flag: '🇸🇪',
    name: 'Svensk krona',
    symbol: 'kr',
    position: 'before',
  }),
  'SGD': CurrencyInfo.parse({
    code: 'SGD',
    flag: '🇸🇬',
    name: 'Singapore dollar',
    symbol: 'S$',
    position: 'before',
  }),
  'THB': CurrencyInfo.parse({
    code: 'THB',
    flag: '🇹🇭',
    name: 'Thai baht',
    symbol: '฿',
    position: 'before',
  }),
  'TRY': CurrencyInfo.parse({
    code: 'TRY',
    flag: '🇹🇷',
    name: 'Türk lirası',
    symbol: '₺',
    position: 'before',
  }),
  'UAH': CurrencyInfo.parse({
    code: 'UAH',
    flag: '🇺🇦',
    name: 'Українська гривня',
    symbol: '₴',
    position: 'after',
  }),
  'USD': CurrencyInfo.parse({
    code: 'USD',
    flag: '🇺🇸',
    name: 'US dollar',
    symbol: '$',
    position: 'before',
  }),
  'ZAR': CurrencyInfo.parse({
    code: 'ZAR',
    flag: '🇿🇦',
    name: 'South African rand',
    symbol: 'R',
    position: 'before',
  }),
} as const

export function getCurrencyLeftText(
  code: CurrencyCode | undefined
): string | undefined {
  if (!code) return undefined
  const currency = currencies[code]
  if (currency.position !== 'before') return undefined
  return currency.symbol
}

export function getCurrencyRightText(
  code: CurrencyCode | undefined
): string | undefined {
  if (!code) return undefined
  const currency = currencies[code]
  if (currency.position !== 'after') return undefined
  return currency.symbol
}

export function formatCurrencyAmount(
  code: CurrencyCode,
  amount: number
): string {
  const currency = currencies[code]
  if (currency.position === 'before') {
    return `${currency.symbol}${bigNumberToString(amount)}`
  }
  return `${bigNumberToString(amount)} ${currency.symbol}`
}
