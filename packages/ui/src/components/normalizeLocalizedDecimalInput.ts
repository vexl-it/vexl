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

function getDecimalSeparatorIndex(
  value: string,
  localizedDecimalSeparator: string
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
  if (separatorCount === 1 || hasDifferentSeparators) {
    return lastSeparatorIndex
  }

  return hasOnlyThreeDigitGroups(value, firstSeparator)
    ? -1
    : lastSeparatorIndex
}

export function normalizeLocalizedDecimalInput(
  value: string,
  locale: string
): string {
  const normalizedDigits = normalizeDigits(value)
  const separators = getNumberSeparators(locale)
  const decimalSeparatorIndex = getDecimalSeparatorIndex(
    normalizedDigits,
    separators.decimal
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
