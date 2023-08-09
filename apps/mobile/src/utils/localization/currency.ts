import {bigNumberToString} from '../bigNumberToString'
import {
  type CurrencyCode,
  CurrencyInfo,
} from '@vexl-next/domain/dist/general/currency.brand'

export const currencies = {
  'AED': CurrencyInfo.parse({
    code: 'AED',
    flag: '🇦🇪',
    name: 'درهم إماراتي',
    symbol: 'د.إ',
    position: 'before',
    maxAmount: 40000,
    countryCode: [971],
  }),
  'AUD': CurrencyInfo.parse({
    code: 'AUD',
    flag: '🇦🇺',
    name: 'Australian dollar',
    symbol: 'AU$',
    position: 'before',
    maxAmount: 16000,
    countryCode: [61],
  }),
  'BGN': CurrencyInfo.parse({
    code: 'BGN',
    flag: '🇧🇬',
    name: 'Български лев',
    symbol: 'лв',
    position: 'after',
    maxAmount: 19000,
    countryCode: [359],
  }),
  'BRL': CurrencyInfo.parse({
    code: 'BRL',
    flag: '🇧🇷',
    name: 'Real brasileiro',
    symbol: 'R$',
    position: 'before',
    maxAmount: 50000,
    countryCode: [55],
  }),
  'CAD': CurrencyInfo.parse({
    code: 'CAD',
    flag: '🇨🇦',
    name: 'Canadian dollar',
    symbol: 'CA$',
    position: 'before',
    maxAmount: 14000,
    countryCode: [1],
  }),
  'CHF': CurrencyInfo.parse({
    code: 'CHF',
    flag: '🇨🇭',
    name: 'Schweizer Franken',
    symbol: 'Fr',
    position: 'before',
    maxAmount: 9000,
    countryCode: [41],
  }),
  'CLP': CurrencyInfo.parse({
    code: 'CLP',
    flag: '🇨🇱',
    name: 'Peso chileno',
    symbol: 'CLP$',
    position: 'before',
    maxAmount: 9400000,
    countryCode: [56],
  }),
  'CNY': CurrencyInfo.parse({
    code: 'CNY',
    flag: '🇨🇳',
    name: '人民币',
    symbol: '¥',
    position: 'before',
    maxAmount: 75000,
    countryCode: [86],
  }),
  'CZK': CurrencyInfo.parse({
    code: 'CZK',
    flag: '🇨🇿',
    name: 'Koruna česká',
    symbol: 'Kč',
    position: 'after',
    maxAmount: 250000,
    countryCode: [420],
  }),
  'DKK': CurrencyInfo.parse({
    code: 'DKK',
    flag: '🇩🇰',
    name: 'Danske kroner',
    symbol: 'kr',
    position: 'before',
    maxAmount: 74000,
    countryCode: [45],
  }),
  'EUR': CurrencyInfo.parse({
    code: 'EUR',
    flag: '🇪🇺',
    name: 'Euro',
    symbol: '€',
    position: 'before',
    maxAmount: 10000,
    countryCode: [
      356, 421, 352, 386, 370, 371, 49, 39, 33, 34, 351, 30, 31, 43, 353, 32,
      358, 385, 357, 372,
    ],
  }),
  'GBP': CurrencyInfo.parse({
    code: 'GBP',
    flag: '🇬🇧',
    name: 'British pound',
    symbol: '£',
    position: 'before',
    maxAmount: 8000,
    countryCode: [44],
  }),
  'HKD': CurrencyInfo.parse({
    code: 'HKD',
    flag: '🇭🇰',
    name: '港幣',
    symbol: 'HK$',
    position: 'before',
    maxAmount: 85000,
    countryCode: [852],
  }),
  'HUF': CurrencyInfo.parse({
    code: 'HUF',
    flag: '🇭🇺',
    name: 'Magyar forint',
    symbol: 'Ft',
    position: 'after',
    maxAmount: 3500000,
    countryCode: [36],
  }),
  'IDR': CurrencyInfo.parse({
    code: 'IDR',
    flag: '🇮🇩',
    name: 'Rupiah',
    symbol: 'Rp',
    position: 'before',
    maxAmount: 165000,
    countryCode: [62],
  }),
  'ILS': CurrencyInfo.parse({
    code: 'ILS',
    flag: '🇮🇱',
    name: 'שקל חדש',
    symbol: '₪',
    position: 'before',
    maxAmount: 40000,
    countryCode: [972],
  }),
  'INR': CurrencyInfo.parse({
    code: 'INR',
    flag: '🇮🇳',
    name: 'Indian rupee',
    symbol: '₹',
    position: 'before',
    maxAmount: 900000,
    countryCode: [91],
  }),
  'JPY': CurrencyInfo.parse({
    code: 'JPY',
    flag: '🇯🇵',
    name: '日本円',
    symbol: '¥',
    position: 'before',
    maxAmount: 1500000,
    countryCode: [81],
  }),
  'KRW': CurrencyInfo.parse({
    code: 'KRW',
    flag: '🇰🇷',
    name: '대한민국 원',
    symbol: '₩',
    position: 'before',
    maxAmount: 14000000,
    countryCode: [82],
  }),
  'MXN': CurrencyInfo.parse({
    code: 'MXN',
    flag: '🇲🇽',
    name: 'Peso mexicano',
    symbol: 'Mex$',
    position: 'before',
    maxAmount: 180000,
    countryCode: [52],
  }),
  'NOK': CurrencyInfo.parse({
    code: 'NOK',
    flag: '🇳🇴',
    name: 'Norske kroner',
    symbol: 'kr',
    position: 'before',
    maxAmount: 100000,
    countryCode: [47],
  }),
  'NZD': CurrencyInfo.parse({
    code: 'NZD',
    flag: '🇳🇿',
    name: 'New Zealand dollar',
    symbol: 'NZ$',
    position: 'before',
    maxAmount: 18000,
    countryCode: [64],
  }),
  'PLN': CurrencyInfo.parse({
    code: 'PLN',
    flag: '🇵🇱',
    name: 'Złoty',
    symbol: 'zł',
    position: 'after',
    maxAmount: 44000,
    countryCode: [48],
  }),
  'RON': CurrencyInfo.parse({
    code: 'RON',
    flag: '🇷🇴',
    name: 'Leu românesc',
    symbol: 'lei',
    position: 'after',
    maxAmount: 45000,
    countryCode: [40],
  }),
  'RSD': CurrencyInfo.parse({
    code: 'RSD',
    flag: '🇷🇸',
    name: 'Српски динар',
    symbol: 'дин.',
    position: 'after',
    maxAmount: 1000000,
    countryCode: [381],
  }),
  'RUB': CurrencyInfo.parse({
    code: 'RUB',
    flag: '🇷🇺',
    name: 'Российский рубль',
    symbol: '₽',
    position: 'after',
    maxAmount: 1000000,
    countryCode: [7],
  }),
  'SAR': CurrencyInfo.parse({
    code: 'SAR',
    flag: '🇸🇦',
    name: 'ريال سعودي',
    symbol: 'ر.س',
    position: 'before',
    maxAmount: 40000,
    countryCode: [966],
  }),
  'SEK': CurrencyInfo.parse({
    code: 'SEK',
    flag: '🇸🇪',
    name: 'Svensk krona',
    symbol: 'kr',
    position: 'before',
    maxAmount: 100000,
    countryCode: [46],
  }),
  'SGD': CurrencyInfo.parse({
    code: 'SGD',
    flag: '🇸🇬',
    name: 'Singapore dollar',
    symbol: 'S$',
    position: 'before',
    maxAmount: 14000,
    countryCode: [65],
  }),
  'THB': CurrencyInfo.parse({
    code: 'THB',
    flag: '🇹🇭',
    name: 'Thai baht',
    symbol: '฿',
    position: 'before',
    maxAmount: 300000,
    countryCode: [66],
  }),
  'TRY': CurrencyInfo.parse({
    code: 'TRY',
    flag: '🇹🇷',
    name: 'Türk lirası',
    symbol: '₺',
    position: 'before',
    maxAmount: 250000,
    countryCode: [90],
  }),
  'UAH': CurrencyInfo.parse({
    code: 'UAH',
    flag: '🇺🇦',
    name: 'Українська гривня',
    symbol: '₴',
    position: 'after',
    maxAmount: 400000,
    countryCode: [380],
  }),
  'USD': CurrencyInfo.parse({
    code: 'USD',
    flag: '🇺🇸',
    name: 'US dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 10000,
    countryCode: [],
  }),
  'ZAR': CurrencyInfo.parse({
    code: 'ZAR',
    flag: '🇿🇦',
    name: 'South African rand',
    symbol: 'R',
    position: 'before',
    maxAmount: 200000,
    countryCode: [27],
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
