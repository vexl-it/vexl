import {
  CurrencyInfo,
  type CurrencyCode,
} from '@vexl-next/domain/src/general/currency.brand'
import {Schema} from 'effect'
import {bigNumberToString} from '../bigNumberToString'

const decodeCurrencyInfo = Schema.decodeSync(CurrencyInfo)

export const currencies = {
  'AED': decodeCurrencyInfo({
    code: 'AED',
    flag: '🇦🇪',
    name: 'United Arab Emirates Dirham',
    symbol: 'د.إ',
    position: 'after',
    maxAmount: 43800, // 10000 EUR * 4.38 (conversion rate)
    countryCode: [971],
  }),
  'ALL': decodeCurrencyInfo({
    code: 'ALL',
    flag: '🇦🇱',
    name: 'Albanian Lek',
    symbol: 'L',
    position: 'after',
    maxAmount: 1240000, // 10000 EUR * 124 (conversion rate)
    countryCode: [355],
  }),
  'ANG': decodeCurrencyInfo({
    code: 'ANG',
    flag: '🇨🇼',
    name: 'Netherlands Antillean Guilder',
    symbol: 'ƒ',
    position: 'after',
    maxAmount: 21000, // 10000 EUR * 2.10 (conversion rate)
    countryCode: [599],
  }),
  'AOA': decodeCurrencyInfo({
    code: 'AOA',
    flag: '🇦🇴',
    name: 'Angolan Kwanza',
    symbol: 'Kz',
    position: 'after',
    maxAmount: 7741600, // 10000 EUR * 774.16 (conversion rate)
    countryCode: [244],
  }),
  'ARS': decodeCurrencyInfo({
    code: 'ARS',
    flag: '🇦🇷',
    name: 'Argentine Peso',
    symbol: '$',
    position: 'before',
    maxAmount: 11651000, // 10000 EUR * 1165.10 (conversion rate)
    countryCode: [54],
  }),
  'AUD': decodeCurrencyInfo({
    code: 'AUD',
    flag: '🇦🇺',
    name: 'Australian Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 15600, // 10000 EUR * 1.56 (conversion rate)
    countryCode: [61],
  }),
  'AZN': decodeCurrencyInfo({
    code: 'AZN',
    flag: '🇦🇿',
    name: 'Azerbaijani Manat',
    symbol: '₼',
    position: 'after',
    maxAmount: 20400, // 10000 EUR * 2.04 (conversion rate)
    countryCode: [994],
  }),
  'BBD': decodeCurrencyInfo({
    code: 'BBD',
    flag: '🇧🇧',
    name: 'Barbadian Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 17400, // 10000 EUR * 1.74 (conversion rate)
    countryCode: [1],
  }),
  'BDT': decodeCurrencyInfo({
    code: 'BDT',
    flag: '🇧🇩',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    position: 'after',
    maxAmount: 1022400, // 10000 EUR * 102.24 (conversion rate)
    countryCode: [880],
  }),
  'BGN': decodeCurrencyInfo({
    code: 'BGN',
    flag: '🇧🇬',
    name: 'Bulgarian Lev',
    symbol: 'лв',
    position: 'after',
    maxAmount: 19600, // 10000 EUR * 1.96 (conversion rate)
    countryCode: [359],
  }),
  'BHD': decodeCurrencyInfo({
    code: 'BHD',
    flag: '🇧🇭',
    name: 'Bahraini Dinar',
    symbol: 'ب.د',
    position: 'after',
    maxAmount: 4600, // 10000 EUR * 0.46 (conversion rate)
    countryCode: [973],
  }),
  'BIF': decodeCurrencyInfo({
    code: 'BIF',
    flag: '🇧🇮',
    name: 'Burundian Franc',
    symbol: 'FBu',
    position: 'after',
    maxAmount: 21375000, // 10000 EUR * 2137.50 (conversion rate)
    countryCode: [257],
  }),
  'BMD': decodeCurrencyInfo({
    code: 'BMD',
    flag: '🇧🇲',
    name: 'Bermudian Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 11100, // 10000 EUR * 1.11 (conversion rate)
    countryCode: [1],
  }),
  'BOB': decodeCurrencyInfo({
    code: 'BOB',
    flag: '🇧🇴',
    name: 'Bolivian Boliviano',
    symbol: 'Bs.',
    position: 'after',
    maxAmount: 90900, // 10000 EUR * 9.09 (conversion rate)
    countryCode: [591],
  }),
  'BRL': decodeCurrencyInfo({
    code: 'BRL',
    flag: '🇧🇷',
    name: 'Brazilian Real',
    symbol: 'R$',
    position: 'before',
    maxAmount: 61100, // 10000 EUR * 6.11 (conversion rate)
    countryCode: [55],
  }),
  'BSD': decodeCurrencyInfo({
    code: 'BSD',
    flag: '🇧🇸',
    name: 'Bahamian Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 11100, // 10000 EUR * 1.11 (conversion rate)
    countryCode: [1],
  }),
  'BWP': decodeCurrencyInfo({
    code: 'BWP',
    flag: '🇧🇼',
    name: 'Botswana Pula',
    symbol: 'P',
    position: 'after',
    maxAmount: 125200, // 10000 EUR * 12.52 (conversion rate)
    countryCode: [267],
  }),
  'BYN': decodeCurrencyInfo({
    code: 'BYN',
    flag: '🇧🇾',
    name: 'Belarusian Ruble',
    symbol: 'Br',
    position: 'after',
    maxAmount: 28200, // 10000 EUR * 2.82 (conversion rate)
    countryCode: [375],
  }),
  'BZD': decodeCurrencyInfo({
    code: 'BZD',
    flag: '🇧🇿',
    name: 'Belize Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 22400, // 10000 EUR * 2.24 (conversion rate)
    countryCode: [501],
  }),
  'CAD': decodeCurrencyInfo({
    code: 'CAD',
    flag: '🇨🇦',
    name: 'Canadian Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 14900, // 10000 EUR * 1.49 (conversion rate)
    countryCode: [1],
  }),
  'CDF': decodeCurrencyInfo({
    code: 'CDF',
    flag: '🇨🇩',
    name: 'Congolese Franc',
    symbol: 'FC',
    position: 'after',
    maxAmount: 22915000, // 10000 EUR * 2291.50 (conversion rate)
    countryCode: [243],
  }),
  'CHF': decodeCurrencyInfo({
    code: 'CHF',
    flag: '🇨🇭',
    name: 'Swiss Franc',
    symbol: 'CHF',
    position: 'before',
    maxAmount: 10600, // 10000 EUR * 1.06 (conversion rate)
    countryCode: [41],
  }),
  'CLP': decodeCurrencyInfo({
    code: 'CLP',
    flag: '🇨🇱',
    name: 'Chilean Peso',
    symbol: '$',
    position: 'before',
    maxAmount: 8928600, // 10000 EUR * 892.86 (conversion rate)
    countryCode: [56],
  }),
  'CNY': decodeCurrencyInfo({
    code: 'CNY',
    flag: '🇨🇳',
    name: 'Chinese Yuan',
    symbol: '¥',
    position: 'after',
    maxAmount: 71400, // 10000 EUR * 7.14 (conversion rate)
    countryCode: [86],
  }),
  'COP': decodeCurrencyInfo({
    code: 'COP',
    flag: '🇨🇴',
    name: 'Colombian Peso',
    symbol: '$',
    position: 'before',
    maxAmount: 46700000, // 10000 EUR * 4670.00 (conversion rate)
    countryCode: [57],
  }),
  'CRC': decodeCurrencyInfo({
    code: 'CRC',
    flag: '🇨🇷',
    name: 'Costa Rican Colón',
    symbol: '₡',
    position: 'before',
    maxAmount: 7207200, // 10000 EUR * 720.72 (conversion rate)
    countryCode: [506],
  }),
  'CUP': decodeCurrencyInfo({
    code: 'CUP',
    flag: '🇨🇺',
    name: 'Cuban Peso',
    symbol: '$',
    position: 'before',
    maxAmount: 303000, // 10000 EUR * 30.30 (conversion rate)
    countryCode: [53],
  }),
  'CZK': decodeCurrencyInfo({
    code: 'CZK',
    flag: '🇨🇿',
    name: 'Czech Koruna',
    symbol: 'Kč',
    position: 'after',
    maxAmount: 254100, // 10000 EUR * 25.41 (conversion rate)
    countryCode: [420],
  }),
  'DJF': decodeCurrencyInfo({
    code: 'DJF',
    flag: '🇩🇯',
    name: 'Djiboutian Franc',
    symbol: 'Fdj',
    position: 'after',
    maxAmount: 1974000, // 10000 EUR * 197.4 (approx. conversion rate)
    countryCode: [253],
  }),
  'DKK': decodeCurrencyInfo({
    code: 'DKK',
    flag: '🇩🇰',
    name: 'Danish Krone',
    symbol: 'kr',
    position: 'after',
    maxAmount: 74500, // 10000 EUR * 7.45 (approx. conversion rate)
    countryCode: [45],
  }),
  'DOP': decodeCurrencyInfo({
    code: 'DOP',
    flag: '🇩🇴',
    name: 'Dominican Peso',
    symbol: 'RD$',
    position: 'before',
    maxAmount: 611000, // 10000 EUR * 61.1 (approx. conversion rate)
    countryCode: [1],
  }),
  'DZD': decodeCurrencyInfo({
    code: 'DZD',
    flag: '🇩🇿',
    name: 'Algerian Dinar',
    symbol: 'د.ج',
    position: 'after',
    maxAmount: 1485000, // 10000 EUR * 148.5 (approx. conversion rate)
    countryCode: [213],
  }),
  'EGP': decodeCurrencyInfo({
    code: 'EGP',
    flag: '🇪🇬',
    name: 'Egyptian Pound',
    symbol: 'E£',
    position: 'before',
    maxAmount: 340000, // 10000 EUR * 34 (approx. conversion rate)
    countryCode: [20],
  }),
  'ETB': decodeCurrencyInfo({
    code: 'ETB',
    flag: '🇪🇹',
    name: 'Ethiopian Birr',
    symbol: 'Br',
    position: 'after',
    maxAmount: 593600, // 10000 EUR * 59.36 (approx. conversion rate)
    countryCode: [251],
  }),
  'EUR': decodeCurrencyInfo({
    code: 'EUR',
    flag: '🇪🇺',
    name: 'Euro',
    symbol: '€',
    position: 'before',
    maxAmount: 10000, // 10000 EUR
    countryCode: [358],
  }),
  'FJD': decodeCurrencyInfo({
    code: 'FJD',
    flag: '🇫🇯',
    name: 'Fijian Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 23400, // 10000 EUR * 2.34 (approx. conversion rate)
    countryCode: [679],
  }),
  'GBP': decodeCurrencyInfo({
    code: 'GBP',
    flag: '🇬🇧',
    name: 'British Pound Sterling',
    symbol: '£',
    position: 'before',
    maxAmount: 8600, // 10000 EUR * 0.86 (approx. conversion rate)
    countryCode: [44],
  }),
  'GEL': decodeCurrencyInfo({
    code: 'GEL',
    flag: '🇬🇪',
    name: 'Georgian Lari',
    symbol: '₾',
    position: 'after',
    maxAmount: 29500, // 10000 EUR * 2.95 (approx. conversion rate)
    countryCode: [995],
  }),
  'GHS': decodeCurrencyInfo({
    code: 'GHS',
    flag: '🇬🇭',
    name: 'Ghanaian Cedi',
    symbol: '₵',
    position: 'after',
    maxAmount: 130000, // 10000 EUR * 13 (approx. conversion rate)
    countryCode: [233],
  }),
  'GNF': decodeCurrencyInfo({
    code: 'GNF',
    flag: '🇬🇳',
    name: 'Guinean Franc',
    symbol: 'FG',
    position: 'after',
    maxAmount: 108000000, // 10000 EUR * 10800 (approx. conversion rate)
    countryCode: [224],
  }),
  'GTQ': decodeCurrencyInfo({
    code: 'GTQ',
    flag: '🇬🇹',
    name: 'Guatemalan Quetzal',
    symbol: 'Q',
    position: 'after',
    maxAmount: 84300, // 10000 EUR * 8.43 (approx. conversion rate)
    countryCode: [502],
  }),
  'HKD': decodeCurrencyInfo({
    code: 'HKD',
    flag: '🇭🇰',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    position: 'before',
    maxAmount: 87500, // 10000 EUR * 8.75 (approx. conversion rate)
    countryCode: [852],
  }),
  'HNL': decodeCurrencyInfo({
    code: 'HNL',
    flag: '🇭🇳',
    name: 'Honduran Lempira',
    symbol: 'L',
    position: 'after',
    maxAmount: 280000, // 10000 EUR * 28 (approx. conversion rate)
    countryCode: [504],
  }),
  'HTG': decodeCurrencyInfo({
    code: 'HTG',
    flag: '🇭🇹',
    name: 'Haitian Gourde',
    symbol: 'G',
    position: 'after',
    maxAmount: 1150000, // 10000 EUR * 115 (approx. conversion rate)
    countryCode: [509],
  }),
  'HUF': decodeCurrencyInfo({
    code: 'HUF',
    flag: '🇭🇺',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    position: 'after',
    maxAmount: 3750000, // 10000 EUR * 375 (approx. conversion rate)
    countryCode: [36],
  }),
  'IDR': decodeCurrencyInfo({
    code: 'IDR',
    flag: '🇮🇩',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    position: 'after',
    maxAmount: 169000000, // 10000 EUR * 16900 (approx. conversion rate)
    countryCode: [62],
  }),
  'ILS': decodeCurrencyInfo({
    code: 'ILS',
    flag: '🇮🇱',
    name: 'Israeli New Shekel',
    symbol: '₪',
    position: 'before',
    maxAmount: 38300, // 10000 EUR * 3.83 (approx. conversion rate)
    countryCode: [972],
  }),
  'INR': decodeCurrencyInfo({
    code: 'INR',
    flag: '🇮🇳',
    name: 'Indian Rupee',
    symbol: '₹',
    position: 'before',
    maxAmount: 890000, // 10000 EUR * 89 (approx. conversion rate)
    countryCode: [91],
  }),
  'IRR': decodeCurrencyInfo({
    code: 'IRR',
    flag: '🇮🇷',
    name: 'Iranian Rial',
    symbol: '﷼',
    position: 'after',
    maxAmount: 527000000, // 10000 EUR * 52700 (approx. conversion rate)
    countryCode: [98],
  }),
  'ISK': decodeCurrencyInfo({
    code: 'ISK',
    flag: '🇮🇸',
    name: 'Icelandic Króna',
    symbol: 'kr',
    position: 'after',
    maxAmount: 1465000, // 10000 EUR * 146.5 (approx. conversion rate)
    countryCode: [354],
  }),
  'JMD': decodeCurrencyInfo({
    code: 'JMD',
    flag: '🇯🇲',
    name: 'Jamaican Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 1740000, // 10000 EUR * 174 (approx. conversion rate)
    countryCode: [1],
  }),
  'JOD': decodeCurrencyInfo({
    code: 'JOD',
    flag: '🇯🇴',
    name: 'Jordanian Dinar',
    symbol: 'د.ا',
    position: 'after',
    maxAmount: 7100, // 10000 EUR * 0.71 (approx. conversion rate)
    countryCode: [962],
  }),
  'JPY': decodeCurrencyInfo({
    code: 'JPY',
    flag: '🇯🇵',
    name: 'Japanese Yen',
    symbol: '¥',
    position: 'after',
    maxAmount: 1460000, // 10000 EUR * 146 (approx. conversion rate)
    countryCode: [81],
  }),
  'KES': decodeCurrencyInfo({
    code: 'KES',
    flag: '🇰🇪',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    position: 'after',
    maxAmount: 1570000, // 10000 EUR * 157 (approx. conversion rate)
    countryCode: [254],
  }),
  'KGS': decodeCurrencyInfo({
    code: 'KGS',
    flag: '🇰🇬',
    name: 'Kyrgyzstani Som',
    symbol: 'сом',
    position: 'after',
    maxAmount: 1035000, // 10000 EUR * 103.5 (approx. conversion rate)
    countryCode: [996],
  }),
  'KHR': decodeCurrencyInfo({
    code: 'KHR',
    flag: '🇰🇭',
    name: 'Cambodian Riel',
    symbol: '៛',
    position: 'after',
    maxAmount: 45100000, // 10000 EUR * 4510 (approx. conversion rate)
    countryCode: [855],
  }),
  'KRW': decodeCurrencyInfo({
    code: 'KRW',
    flag: '🇰🇷',
    name: 'South Korean Won',
    symbol: '₩',
    position: 'after',
    maxAmount: 13800000, // 10000 EUR * 1380 (approx. conversion rate)
    countryCode: [82],
  }),
  'KWD': decodeCurrencyInfo({
    code: 'KWD',
    flag: '🇰🇼',
    name: 'Kuwaiti Dinar',
    symbol: 'د.ك',
    position: 'after',
    maxAmount: 3400, // 10000 EUR * 0.34 (approx. conversion rate)
    countryCode: [965],
  }),
  'KZT': decodeCurrencyInfo({
    code: 'KZT',
    flag: '🇰🇿',
    name: 'Kazakhstani Tenge',
    symbol: '₸',
    position: 'after',
    maxAmount: 4800000, // 10000 EUR * 480 (approx. conversion rate)
    countryCode: [7],
  }),
  'LAK': decodeCurrencyInfo({
    code: 'LAK',
    flag: '🇱🇦',
    name: 'Lao Kip',
    symbol: '₭',
    position: 'after',
    maxAmount: 105000000, // 10000 EUR * 10500 (approx. conversion rate)
    countryCode: [856],
  }),
  'LBP': decodeCurrencyInfo({
    code: 'LBP',
    flag: '🇱🇧',
    name: 'Lebanese Pound',
    symbol: 'ل.ل',
    position: 'after',
    maxAmount: 165000000, // 10000 EUR * 16500 (approx. conversion rate)
    countryCode: [961],
  }),
  'LKR': decodeCurrencyInfo({
    code: 'LKR',
    flag: '🇱🇰',
    name: 'Sri Lankan Rupee',
    symbol: 'Rs',
    position: 'after',
    maxAmount: 3700000, // 10000 EUR * 370 (approx. conversion rate)
    countryCode: [94],
  }),
  'LRD': decodeCurrencyInfo({
    code: 'LRD',
    flag: '🇱🇷',
    name: 'Liberian Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 1950000, // 10000 EUR * 195 (approx. conversion rate)
    countryCode: [231],
  }),
  'LSL': decodeCurrencyInfo({
    code: 'LSL',
    flag: '🇱🇸',
    name: 'Lesotho Loti',
    symbol: 'L',
    position: 'after',
    maxAmount: 190000, // 10000 EUR * 19 (approx. conversion rate)
    countryCode: [266],
  }),
  'MAD': decodeCurrencyInfo({
    code: 'MAD',
    flag: '🇲🇦',
    name: 'Moroccan Dirham',
    symbol: 'د.م.',
    position: 'after',
    maxAmount: 110000, // 10000 EUR * 11 (approx. conversion rate)
    countryCode: [212],
  }),
  'MDL': decodeCurrencyInfo({
    code: 'MDL',
    flag: '🇲🇩',
    name: 'Moldovan Leu',
    symbol: 'MDL',
    position: 'after',
    maxAmount: 196000, // 10000 EUR * 19.6 (approx. conversion rate)
    countryCode: [373],
  }),
  'MGA': decodeCurrencyInfo({
    code: 'MGA',
    flag: '🇲🇬',
    name: 'Malagasy Ariary',
    symbol: 'Ar',
    position: 'after',
    maxAmount: 46100000, // 10000 EUR * 4610 (approx. conversion rate)
    countryCode: [261],
  }),
  'MKD': decodeCurrencyInfo({
    code: 'MKD',
    flag: '🇲🇰',
    name: 'Macedonian Denar',
    symbol: 'ден',
    position: 'after',
    maxAmount: 615000, // 10000 EUR * 61.5 (approx. conversion rate)
    countryCode: [389],
  }),
  'MMK': decodeCurrencyInfo({
    code: 'MMK',
    flag: '🇲🇲',
    name: 'Myanmar Kyat',
    symbol: 'K',
    position: 'after',
    maxAmount: 23180000, // 10000 EUR * 2318 (approx. conversion rate)
    countryCode: [95],
  }),
  'MNT': decodeCurrencyInfo({
    code: 'MNT',
    flag: '🇲🇳',
    name: 'Mongolian Tugrik',
    symbol: '₮',
    position: 'after',
    maxAmount: 38780000, // 10000 EUR * 3878 (approx. conversion rate)
    countryCode: [976],
  }),
  'MOP': decodeCurrencyInfo({
    code: 'MOP',
    flag: '🇲🇴',
    name: 'Macanese Pataca',
    symbol: 'MOP$',
    position: 'after',
    maxAmount: 88400, // 10000 EUR * 8.84 (approx. conversion rate)
    countryCode: [853],
  }),
  'MRU': decodeCurrencyInfo({
    code: 'MRU',
    flag: '🇲🇷',
    name: 'Mauritanian Ouguiya',
    symbol: 'UM',
    position: 'after',
    maxAmount: 418000, // 10000 EUR * 41.8 (approx. conversion rate)
    countryCode: [222],
  }),
  'MUR': decodeCurrencyInfo({
    code: 'MUR',
    flag: '🇲🇺',
    name: 'Mauritian Rupee',
    symbol: '₨',
    position: 'after',
    maxAmount: 489000, // 10000 EUR * 48.9 (approx. conversion rate)
    countryCode: [230],
  }),
  'MVR': decodeCurrencyInfo({
    code: 'MVR',
    flag: '🇲🇻',
    name: 'Maldivian Rufiyaa',
    symbol: 'ރ.',
    position: 'after',
    maxAmount: 174000, // 10000 EUR * 17.4 (approx. conversion rate)
    countryCode: [960],
  }),
  'MWK': decodeCurrencyInfo({
    code: 'MWK',
    flag: '🇲🇼',
    name: 'Malawian Kwacha',
    symbol: 'MK',
    position: 'after',
    maxAmount: 11740000, // 10000 EUR * 1174 (approx. conversion rate)
    countryCode: [265],
  }),
  'MXN': decodeCurrencyInfo({
    code: 'MXN',
    flag: '🇲🇽',
    name: 'Mexican Peso',
    symbol: '$',
    position: 'before',
    maxAmount: 198000, // 10000 EUR * 19.8 (approx. conversion rate)
    countryCode: [52],
  }),
  'MYR': decodeCurrencyInfo({
    code: 'MYR',
    flag: '🇲🇾',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    position: 'before',
    maxAmount: 52300, // 10000 EUR * 5.23 (approx. conversion rate)
    countryCode: [60],
  }),
  'MZN': decodeCurrencyInfo({
    code: 'MZN',
    flag: '🇲🇿',
    name: 'Mozambican Metical',
    symbol: 'MT',
    position: 'after',
    maxAmount: 700000, // 10000 EUR * 70 (approx. conversion rate)
    countryCode: [258],
  }),
  'NAD': decodeCurrencyInfo({
    code: 'NAD',
    flag: '🇳🇦',
    name: 'Namibian Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 190000, // 10000 EUR * 19 (approx. conversion rate)
    countryCode: [264],
  }),
  'NGN': decodeCurrencyInfo({
    code: 'NGN',
    flag: '🇳🇬',
    name: 'Nigerian Naira',
    symbol: '₦',
    position: 'before',
    maxAmount: 9300000, // 10000 EUR * 930 (approx. conversion rate)
    countryCode: [234],
  }),
  'NIO': decodeCurrencyInfo({
    code: 'NIO',
    flag: '🇳🇮',
    name: 'Nicaraguan Córdoba',
    symbol: 'C$',
    position: 'before',
    maxAmount: 414000, // 10000 EUR * 41.4 (approx. conversion rate)
    countryCode: [505],
  }),
  'NOK': decodeCurrencyInfo({
    code: 'NOK',
    flag: '🇳🇴',
    name: 'Norwegian Krone',
    symbol: 'kr',
    position: 'after',
    maxAmount: 116000, // 10000 EUR * 11.6 (approx. conversion rate)
    countryCode: [47],
  }),
  'NPR': decodeCurrencyInfo({
    code: 'NPR',
    flag: '🇳🇵',
    name: 'Nepalese Rupee',
    symbol: '₨',
    position: 'before',
    maxAmount: 1440000, // 10000 EUR * 144 (approx. conversion rate)
    countryCode: [977],
  }),
  'NZD': decodeCurrencyInfo({
    code: 'NZD',
    flag: '🇳🇿',
    name: 'New Zealand Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 17500, // 10000 EUR * 1.75 (approx. conversion rate)
    countryCode: [64],
  }),
  'OMR': decodeCurrencyInfo({
    code: 'OMR',
    flag: '🇴🇲',
    name: 'Omani Rial',
    symbol: 'ر.ع.',
    position: 'after',
    maxAmount: 4000, // 10000 EUR * 0.4 (approx. conversion rate)
    countryCode: [968],
  }),
  'PAB': decodeCurrencyInfo({
    code: 'PAB',
    flag: '🇵🇦',
    name: 'Panamanian Balboa',
    symbol: 'B/.',
    position: 'before',
    maxAmount: 11100, // 10000 EUR * 1.11 (approx. conversion rate)
    countryCode: [507],
  }),
  'PEN': decodeCurrencyInfo({
    code: 'PEN',
    flag: '🇵🇪',
    name: 'Peruvian Sol',
    symbol: 'S/.',
    position: 'before',
    maxAmount: 37800, // 10000 EUR * 3.78 (approx. conversion rate)
    countryCode: [51],
  }),
  'PGK': decodeCurrencyInfo({
    code: 'PGK',
    flag: '🇵🇬',
    name: 'Papua New Guinean Kina',
    symbol: 'K',
    position: 'before',
    maxAmount: 39400, // 10000 EUR * 3.94 (approx. conversion rate)
    countryCode: [675],
  }),
  'PHP': decodeCurrencyInfo({
    code: 'PHP',
    flag: '🇵🇭',
    name: 'Philippine Peso',
    symbol: '₱',
    position: 'before',
    maxAmount: 609000, // 10000 EUR * 60.9 (approx. conversion rate)
    countryCode: [63],
  }),
  'PKR': decodeCurrencyInfo({
    code: 'PKR',
    flag: '🇵🇰',
    name: 'Pakistani Rupee',
    symbol: '₨',
    position: 'before',
    maxAmount: 3110000, // 10000 EUR * 311 (approx. conversion rate)
    countryCode: [92],
  }),
  'PLN': decodeCurrencyInfo({
    code: 'PLN',
    flag: '🇵🇱',
    name: 'Polish Zloty',
    symbol: 'zł',
    position: 'after',
    maxAmount: 47000, // 10000 EUR * 4.7 (approx. conversion rate)
    countryCode: [48],
  }),
  'PYG': decodeCurrencyInfo({
    code: 'PYG',
    flag: '🇵🇾',
    name: 'Paraguayan Guarani',
    symbol: '₲',
    position: 'after',
    maxAmount: 81500000, // 10000 EUR * 8150 (approx. conversion rate)
    countryCode: [595],
  }),
  'QAR': decodeCurrencyInfo({
    code: 'QAR',
    flag: '🇶🇦',
    name: 'Qatari Riyal',
    symbol: 'ر.ق',
    position: 'after',
    maxAmount: 40500, // 10000 EUR * 4.05 (approx. conversion rate)
    countryCode: [974],
  }),
  'RON': decodeCurrencyInfo({
    code: 'RON',
    flag: '🇷🇴',
    name: 'Romanian Leu',
    symbol: 'lei',
    position: 'after',
    maxAmount: 49000, // 10000 EUR * 4.9 (approx. conversion rate)
    countryCode: [40],
  }),
  'RSD': decodeCurrencyInfo({
    code: 'RSD',
    flag: '🇷🇸',
    name: 'Serbian Dinar',
    symbol: 'дин.',
    position: 'after',
    maxAmount: 1170000, // 10000 EUR * 117 (approx. conversion rate)
    countryCode: [381],
  }),
  'RUB': decodeCurrencyInfo({
    code: 'RUB',
    flag: '🇷🇺',
    name: 'Russian Ruble',
    symbol: '₽',
    position: 'after',
    maxAmount: 1124000, // 10000 EUR * 112.4 (approx. conversion rate)
    countryCode: [7],
  }),
  'RWF': decodeCurrencyInfo({
    code: 'RWF',
    flag: '🇷🇼',
    name: 'Rwandan Franc',
    symbol: 'FRw',
    position: 'after',
    maxAmount: 12360000, // 10000 EUR * 1236 (approx. conversion rate)
    countryCode: [250],
  }),
  'SAR': decodeCurrencyInfo({
    code: 'SAR',
    flag: '🇸🇦',
    name: 'Saudi Riyal',
    symbol: 'ر.س',
    position: 'after',
    maxAmount: 40900, // 10000 EUR * 4.09 (approx. conversion rate)
    countryCode: [966],
  }),
  'SCR': decodeCurrencyInfo({
    code: 'SCR',
    flag: '🇸🇨',
    name: 'Seychellois Rupee',
    symbol: '₨',
    position: 'before',
    maxAmount: 153600, // 10000 EUR * 15.36 (approx. conversion rate)
    countryCode: [248],
  }),
  'SEK': decodeCurrencyInfo({
    code: 'SEK',
    flag: '🇸🇪',
    name: 'Swedish Krona',
    symbol: 'kr',
    position: 'after',
    maxAmount: 115000, // 10000 EUR * 11.5 (approx. conversion rate)
    countryCode: [46],
  }),
  'SGD': decodeCurrencyInfo({
    code: 'SGD',
    flag: '🇸🇬',
    name: 'Singapore Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 14700, // 10000 EUR * 1.47 (approx. conversion rate)
    countryCode: [65],
  }),
  'SLL': decodeCurrencyInfo({
    code: 'SLL',
    flag: '🇸🇱',
    name: 'Sierra Leonean Leone',
    symbol: 'Le',
    position: 'after',
    maxAmount: 229000000, // 10000 EUR * 22900 (approx. conversion rate)
    countryCode: [232],
  }),
  'SOS': decodeCurrencyInfo({
    code: 'SOS',
    flag: '🇸🇴',
    name: 'Somali Shilling',
    symbol: 'Sh',
    position: 'after',
    maxAmount: 6270000, // 10000 EUR * 627 (approx. conversion rate)
    countryCode: [252],
  }),
  'SRD': decodeCurrencyInfo({
    code: 'SRD',
    flag: '🇸🇷',
    name: 'Surinamese Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 257000, // 10000 EUR * 25.7 (approx. conversion rate)
    countryCode: [597],
  }),
  'SZL': decodeCurrencyInfo({
    code: 'SZL',
    flag: '🇸🇿',
    name: 'Swazi Lilangeni',
    symbol: 'E',
    position: 'after',
    maxAmount: 192000, // 10000 EUR * 19.2 (approx. conversion rate)
    countryCode: [268],
  }),
  'THB': decodeCurrencyInfo({
    code: 'THB',
    flag: '🇹🇭',
    name: 'Thai Baht',
    symbol: '฿',
    position: 'before',
    maxAmount: 365000, // 10000 EUR * 36.5 (approx. conversion rate)
    countryCode: [66],
  }),
  'TJS': decodeCurrencyInfo({
    code: 'TJS',
    flag: '🇹🇯',
    name: 'Tajikistani Somoni',
    symbol: 'ЅМ',
    position: 'after',
    maxAmount: 115300, // 10000 EUR * 11.53 (approx. conversion rate)
    countryCode: [992],
  }),
  'TMT': decodeCurrencyInfo({
    code: 'TMT',
    flag: '🇹🇲',
    name: 'Turkmenistan Manat',
    symbol: 'T',
    position: 'after',
    maxAmount: 40000, // 10000 EUR * 4 (approx. conversion rate)
    countryCode: [993],
  }),
  'TND': decodeCurrencyInfo({
    code: 'TND',
    flag: '🇹🇳',
    name: 'Tunisian Dinar',
    symbol: 'د.ت',
    position: 'after',
    maxAmount: 33500, // 10000 EUR * 3.35 (approx. conversion rate)
    countryCode: [216],
  }),
  'TOP': decodeCurrencyInfo({
    code: 'TOP',
    flag: '🇹🇴',
    name: 'Tongan Paʻanga',
    symbol: 'T$',
    position: 'before',
    maxAmount: 23800, // 10000 EUR * 2.38 (approx. conversion rate)
    countryCode: [676],
  }),
  'TRY': decodeCurrencyInfo({
    code: 'TRY',
    flag: '🇹🇷',
    name: 'Turkish Lira',
    symbol: '₺',
    position: 'after',
    maxAmount: 293200, // 10000 EUR * 29.32 (approx. conversion rate)
    countryCode: [90],
  }),
  'TTD': decodeCurrencyInfo({
    code: 'TTD',
    flag: '🇹🇹',
    name: 'Trinidad and Tobago Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 75000, // 10000 EUR * 7.5 (approx. conversion rate)
    countryCode: [1, 868],
  }),
  'TWD': decodeCurrencyInfo({
    code: 'TWD',
    flag: '🇹🇼',
    name: 'New Taiwan Dollar',
    symbol: 'NT$',
    position: 'before',
    maxAmount: 336000, // 10000 EUR * 33.6 (approx. conversion rate)
    countryCode: [886],
  }),
  'TZS': decodeCurrencyInfo({
    code: 'TZS',
    flag: '🇹🇿',
    name: 'Tanzanian Shilling',
    symbol: 'TSh',
    position: 'after',
    maxAmount: 27800000, // 10000 EUR * 2780 (approx. conversion rate)
    countryCode: [255],
  }),
  'UAH': decodeCurrencyInfo({
    code: 'UAH',
    flag: '🇺🇦',
    name: 'Ukrainian Hryvnia',
    symbol: '₴',
    position: 'after',
    maxAmount: 408000, // 10000 EUR * 40.8 (approx. conversion rate)
    countryCode: [380],
  }),
  'UGX': decodeCurrencyInfo({
    code: 'UGX',
    flag: '🇺🇬',
    name: 'Ugandan Shilling',
    symbol: 'USh',
    position: 'after',
    maxAmount: 40000000, // 10000 EUR * 4000 (approx. conversion rate)
    countryCode: [256],
  }),
  'USD': decodeCurrencyInfo({
    code: 'USD',
    flag: '🇺🇸',
    name: 'United States Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 11000, // 10000 EUR * 1.1 (approx. conversion rate)
    countryCode: [1],
  }),
  'UYU': decodeCurrencyInfo({
    code: 'UYU',
    flag: '🇺🇾',
    name: 'Uruguayan Peso',
    symbol: '$',
    position: 'before',
    maxAmount: 430000, // 10000 EUR * 43 (approx. conversion rate)
    countryCode: [598],
  }),
  'UZS': decodeCurrencyInfo({
    code: 'UZS',
    flag: '🇺🇿',
    name: 'Uzbekistani Som',
    symbol: 'soʻm',
    position: 'after',
    maxAmount: 122700000, // 10000 EUR * 12270 (approx. conversion rate)
    countryCode: [998],
  }),
  'VES': decodeCurrencyInfo({
    code: 'VES',
    flag: '🇻🇪',
    name: 'Venezuelan Bolívar',
    symbol: 'Bs.',
    position: 'before',
    maxAmount: 270000, // 10000 EUR * 27 (approx. conversion rate)
    countryCode: [58],
  }),
  'VND': decodeCurrencyInfo({
    code: 'VND',
    flag: '🇻🇳',
    name: 'Vietnamese Dong',
    symbol: '₫',
    position: 'after',
    maxAmount: 263000000, // 10000 EUR * 26300 (approx. conversion rate)
    countryCode: [84],
  }),
  'VUV': decodeCurrencyInfo({
    code: 'VUV',
    flag: '🇻🇺',
    name: 'Vanuatu Vatu',
    symbol: 'Vt',
    position: 'after',
    maxAmount: 1320000, // 10000 EUR * 132 (approx. conversion rate)
    countryCode: [678],
  }),
  'WST': decodeCurrencyInfo({
    code: 'WST',
    flag: '🇼🇸',
    name: 'Samoan Tala',
    symbol: 'T',
    position: 'before',
    maxAmount: 28000, // 10000 EUR * 2.8 (approx. conversion rate)
    countryCode: [685],
  }),
  'XAF': decodeCurrencyInfo({
    code: 'XAF',
    flag: '🌍',
    name: 'Central African CFA Franc',
    symbol: 'FCFA',
    position: 'after',
    maxAmount: 6560000, // 10000 EUR * 656 (approx. conversion rate)
    countryCode: [237],
  }),
  'XAG': decodeCurrencyInfo({
    code: 'XAG',
    flag: '⚪',
    name: 'Silver (troy ounce)',
    symbol: 'oz t',
    position: 'after',
    maxAmount: 400, // 10000 EUR / 25 (approx. conversion rate, assuming 1 oz = 25 EUR)
    countryCode: [],
  }),
  'XAU': decodeCurrencyInfo({
    code: 'XAU',
    flag: '🟡',
    name: 'Gold (troy ounce)',
    symbol: 'oz t',
    position: 'after',
    maxAmount: 5, // 10000 EUR / 2000 (approx. conversion rate, assuming 1 oz = 2000 EUR)
    countryCode: [],
  }),
  'XCD': decodeCurrencyInfo({
    code: 'XCD',
    flag: '🇧🇶',
    name: 'East Caribbean Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 29700, // 10000 EUR * 2.97 (approx. conversion rate)
    countryCode: [1],
  }),
  'XOF': decodeCurrencyInfo({
    code: 'XOF',
    flag: '🌍',
    name: 'West African CFA Franc',
    symbol: 'CFA',
    position: 'after',
    maxAmount: 6560000, // 10000 EUR * 656 (approx. conversion rate)
    countryCode: [225],
  }),
  'XPF': decodeCurrencyInfo({
    code: 'XPF',
    flag: '🇵🇫',
    name: 'CFP Franc',
    symbol: '₣',
    position: 'after',
    maxAmount: 1190000, // 10000 EUR * 119 (approx. conversion rate)
    countryCode: [687],
  }),
  'ZAR': decodeCurrencyInfo({
    code: 'ZAR',
    flag: '🇿🇦',
    name: 'South African Rand',
    symbol: 'R',
    position: 'before',
    maxAmount: 210000, // 10000 EUR * 21 (approx. conversion rate)
    countryCode: [27],
  }),
  'ZMW': decodeCurrencyInfo({
    code: 'ZMW',
    flag: '🇿🇲',
    name: 'Zambian Kwacha',
    symbol: 'ZK',
    position: 'after',
    maxAmount: 215000, // 10000 EUR * 21.5 (approx. conversion rate)
    countryCode: [260],
  }),
  'ZWL': decodeCurrencyInfo({
    code: 'ZWL',
    flag: '🇿🇼',
    name: 'Zimbabwean Dollar',
    symbol: '$',
    position: 'before',
    maxAmount: 3600000, // 10000 EUR * 360 (approx. conversion rate)
    countryCode: [263],
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
