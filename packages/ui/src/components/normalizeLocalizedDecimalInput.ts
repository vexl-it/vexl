import {Array, pipe} from 'effect'

const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const EXTENDED_ARABIC_INDIC_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC_DECIMAL_SEPARATOR = '٫'
const ARABIC_GROUPING_SEPARATOR = '٬'

interface NumberSeparators {
  readonly decimal: string
  readonly grouping: string | undefined
}

function isAsciiDigit(character: string): boolean {
  return character >= '0' && character <= '9'
}

function findSeparator(formattedValue: string): string | undefined {
  for (const character of normalizeDigits(formattedValue)) {
    if (!isAsciiDigit(character)) return character
  }

  return undefined
}

function getNumberSeparators(locale: string): NumberSeparators {
  const formatter = new Intl.NumberFormat(locale)
  const decimal = findSeparator(formatter.format(1.1)) ?? '.'
  const grouping = findSeparator(formatter.format(12_345))

  return {decimal, grouping}
}

function normalizeDigit(character: string): string {
  const arabicIndicDigit = ARABIC_INDIC_DIGITS.indexOf(character)
  if (arabicIndicDigit >= 0) return String(arabicIndicDigit)

  const extendedArabicIndicDigit =
    EXTENDED_ARABIC_INDIC_DIGITS.indexOf(character)
  if (extendedArabicIndicDigit >= 0) return String(extendedArabicIndicDigit)

  return character
}

function normalizeDigits(value: string): string {
  let normalized = ''

  for (const character of value) {
    normalized += normalizeDigit(character)
  }

  return normalized
}

function isDecimalSeparator(character: string, localized: string): boolean {
  return (
    character === localized ||
    character === '.' ||
    character === ',' ||
    character === ARABIC_DECIMAL_SEPARATOR
  )
}

function isGroupingSeparator(
  character: string,
  localized: string | undefined
): boolean {
  return (
    character === localized ||
    character === ARABIC_GROUPING_SEPARATOR ||
    character === ' ' ||
    character === '\u00a0' ||
    character === '\u202f' ||
    character === "'"
  )
}

function hasOnlyThreeDigitGroups(value: string, separator: string): boolean {
  const firstSeparatorIndex = value.indexOf(separator)
  if (firstSeparatorIndex <= 0) return false

  let groupStartIndex = firstSeparatorIndex + separator.length

  while (groupStartIndex <= value.length) {
    const nextSeparatorIndex = value.indexOf(separator, groupStartIndex)
    const groupEndIndex =
      nextSeparatorIndex >= 0 ? nextSeparatorIndex : value.length

    if (groupEndIndex - groupStartIndex !== 3) return false
    if (nextSeparatorIndex < 0) return true

    groupStartIndex = nextSeparatorIndex + separator.length
  }

  return false
}

/**
 * How to read a single separator that could be either a decimal point or a
 * thousands separator. See the tie-break rules on `getDecimalSeparatorIndex`.
 */
export type LoneSeparatorMode = 'decimalPoint' | 'thousandsSeparator'

function isLoneThousandsSeparator(
  value: string,
  separatorIndex: number,
  separator: string,
  localizedDecimalSeparator: string
): boolean {
  if (separator === localizedDecimalSeparator) return false
  if (separatorIndex <= 0) return false

  const trailing = value.slice(separatorIndex + 1)

  return (
    trailing.length === 3 &&
    pipe(Array.fromIterable(trailing), Array.every(isAsciiDigit))
  )
}

/**
 * A value being typed is not a formatted number, so `.` and `,` are ambiguous.
 * Tie-break rules, in order:
 * 1. Different separators (`1.234,56`): the last one is the decimal point.
 * 2. Repeated identical separators forming 3-digit groups (`1.234.567`): all of
 *    them are thousands separators, there is no decimal point.
 * 3. Repeated identical separators that do not form 3-digit groups (`1,5,`):
 *    the first one is the decimal point, the rest are dropped - the decimal
 *    point must never move while typing.
 * 4. A lone separator is the decimal point, except in `thousandsSeparator`
 *    mode, where a separator that is not the locale decimal separator and is
 *    followed by exactly three digits (`1,000` in en-US) groups thousands.
 *    Values with many decimals (BTC) use `decimalPoint` mode instead, because
 *    `0.005` in a comma-decimal locale has to stay `0.005`.
 */
function getDecimalSeparatorIndex(
  value: string,
  localizedDecimalSeparator: string,
  loneSeparatorMode: LoneSeparatorMode
): number {
  let firstSeparatorIndex = -1
  let lastSeparatorIndex = -1
  let separatorCount = 0
  let firstSeparator = ''
  let hasDifferentSeparators = false

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index] ?? ''
    if (!isDecimalSeparator(character, localizedDecimalSeparator)) continue

    if (firstSeparatorIndex < 0) {
      firstSeparatorIndex = index
      firstSeparator = character
    } else if (character !== firstSeparator) {
      hasDifferentSeparators = true
    }

    lastSeparatorIndex = index
    separatorCount += 1
  }

  if (separatorCount === 0) return -1
  if (hasDifferentSeparators) return lastSeparatorIndex

  if (separatorCount === 1) {
    return loneSeparatorMode === 'thousandsSeparator' &&
      isLoneThousandsSeparator(
        value,
        firstSeparatorIndex,
        firstSeparator,
        localizedDecimalSeparator
      )
      ? -1
      : firstSeparatorIndex
  }

  return hasOnlyThreeDigitGroups(value, firstSeparator)
    ? -1
    : firstSeparatorIndex
}

export function normalizeLocalizedDecimalInput(
  value: string,
  locale: string,
  loneSeparatorMode: LoneSeparatorMode = 'decimalPoint'
): string {
  const normalizedDigits = normalizeDigits(value)
  const separators = getNumberSeparators(locale)
  const decimalSeparatorIndex = getDecimalSeparatorIndex(
    normalizedDigits,
    separators.decimal,
    loneSeparatorMode
  )
  let normalized = ''

  for (let index = 0; index < normalizedDigits.length; index += 1) {
    const character = normalizedDigits[index] ?? ''

    if (isDecimalSeparator(character, separators.decimal)) {
      if (index === decimalSeparatorIndex) normalized += '.'
      continue
    }

    if (isGroupingSeparator(character, separators.grouping)) continue

    normalized += character
  }

  return normalized
}

export function localizeDecimalInput(value: string, locale: string): string {
  const decimalSeparator = getNumberSeparators(locale).decimal
  const digitFormatter = new Intl.NumberFormat(locale, {useGrouping: false})
  let localized = ''

  for (const character of value) {
    if (isAsciiDigit(character)) {
      localized += digitFormatter.format(Number(character))
      continue
    }

    if (isDecimalSeparator(character, decimalSeparator)) {
      localized += decimalSeparator
      continue
    }

    localized += character
  }

  return localized
}
