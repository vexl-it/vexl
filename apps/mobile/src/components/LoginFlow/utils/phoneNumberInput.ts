import {
  toE164PhoneNumber,
  type E164PhoneNumber,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Option} from 'effect'
import type {CountryCode} from 'libphonenumber-js'
import {
  AsYouType,
  getExampleNumber,
  isSupportedCountry,
  parsePhoneNumberFromString,
} from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'
import {getCountryByCca2, type ICountry} from 'react-native-country-select'

const FALLBACK_NATIONAL_NUMBER_LENGTH = 15
const FALLBACK_GROUP_LENGTH = 3
const NON_DIGIT_REGEX = /\D/g

export const DEFAULT_COUNTRY = getCountryByCca2('CZ')

export interface PhoneNumberInputState {
  readonly selectedCountry: ICountry | undefined
  readonly nationalNumber: string
  readonly phoneNumber: Option.Option<E164PhoneNumber>
}

export function supportedCountryCode(
  country: ICountry | undefined
): CountryCode | undefined {
  if (country === undefined) return undefined
  return isSupportedCountry(country.cca2) ? country.cca2 : undefined
}

export function countryCallingCode(country: ICountry | undefined): string {
  return country?.idd.root ?? '+420'
}

function digitsOnly(value: string): string {
  return value.replace(NON_DIGIT_REGEX, '')
}

export function getNationalNumberLength(country: ICountry | undefined): number {
  const countryCode = supportedCountryCode(country)
  if (countryCode === undefined) return FALLBACK_NATIONAL_NUMBER_LENGTH

  return (
    getExampleNumber(countryCode, examples)?.nationalNumber.length ??
    FALLBACK_NATIONAL_NUMBER_LENGTH
  )
}

export function getGroupLengths(
  country: ICountry | undefined
): readonly number[] {
  const countryCode = supportedCountryCode(country)
  const exampleNumber =
    countryCode === undefined
      ? undefined
      : getExampleNumber(countryCode, examples)

  if (exampleNumber === undefined) {
    const groups: number[] = []
    const maxLength = getNationalNumberLength(country)

    for (let remainingDigits = maxLength; remainingDigits > 0; ) {
      const groupLength = Math.min(FALLBACK_GROUP_LENGTH, remainingDigits)
      groups.push(groupLength)
      remainingDigits -= groupLength
    }

    return groups
  }

  const formattedExample = new AsYouType().input(exampleNumber.number)
  const nationalExample = formattedExample
    .substring(countryCallingCode(country).length)
    .trim()
  const groups = nationalExample.match(/\d+/g)

  if (groups === null) return [exampleNumber.nationalNumber.length]

  const groupLengths: number[] = []
  for (const group of groups) {
    groupLengths.push(group.length)
  }

  return groupLengths
}

export function splitNationalNumberIntoGroups(
  nationalNumber: string,
  country: ICountry | undefined
): readonly string[] {
  const groups: string[] = []
  let currentIndex = 0

  for (const groupLength of getGroupLengths(country)) {
    groups.push(
      nationalNumber.substring(currentIndex, currentIndex + groupLength)
    )
    currentIndex += groupLength
  }

  while (currentIndex < nationalNumber.length) {
    groups.push(
      nationalNumber.substring(
        currentIndex,
        currentIndex + FALLBACK_GROUP_LENGTH
      )
    )
    currentIndex += FALLBACK_GROUP_LENGTH
  }

  return groups
}

function normalizeInternationalPrefix(value: string): string {
  const plusIndex = value.indexOf('+')
  if (plusIndex >= 0) return value.substring(plusIndex).trim()

  const internationalPrefixIndex = value.indexOf('00')
  if (internationalPrefixIndex >= 0)
    return `+${value.substring(internationalPrefixIndex + 2).trim()}`

  return value.trim()
}

function parsePhoneNumberFromInputValue(
  value: string,
  selectedCountry: ICountry | undefined
): PhoneNumberInputState | undefined {
  const normalizedValue = normalizeInternationalPrefix(value)
  const countryCode = supportedCountryCode(selectedCountry)
  const parsedPhoneNumber =
    countryCode === undefined
      ? parsePhoneNumberFromString(normalizedValue)
      : parsePhoneNumberFromString(normalizedValue, countryCode)

  if (parsedPhoneNumber?.isValid() !== true) return undefined

  const phoneNumber = toE164PhoneNumber(parsedPhoneNumber.number)
  if (Option.isNone(phoneNumber)) return undefined

  return {
    nationalNumber: digitsOnly(parsedPhoneNumber.nationalNumber),
    phoneNumber,
    selectedCountry:
      parsedPhoneNumber.country === undefined
        ? selectedCountry
        : (getCountryByCca2(parsedPhoneNumber.country) ?? selectedCountry),
  }
}

function parseDigitOnlyInternationalPhoneNumber(
  value: string,
  selectedCountry: ICountry | undefined
): PhoneNumberInputState | undefined {
  const digits = digitsOnly(value)
  const nationalNumberLength = getNationalNumberLength(selectedCountry)
  if (digits.length <= nationalNumberLength) return undefined

  const parsedPhoneNumber = parsePhoneNumberFromInputValue(
    `+${digits}`,
    selectedCountry
  )
  if (parsedPhoneNumber !== undefined) return parsedPhoneNumber

  for (
    let suffixStartIndex = 1;
    suffixStartIndex < digits.length;
    suffixStartIndex++
  ) {
    const suffix = digits.substring(suffixStartIndex)
    if (suffix.length <= nationalNumberLength) return undefined

    const parsedSuffixPhoneNumber = parsePhoneNumberFromInputValue(
      `+${suffix}`,
      selectedCountry
    )
    if (parsedSuffixPhoneNumber !== undefined) return parsedSuffixPhoneNumber
  }

  return undefined
}

export function parsePhoneNumberInput(
  value: string,
  selectedCountry: ICountry | undefined
): PhoneNumberInputState {
  const parsedPhoneNumber = parsePhoneNumberFromInputValue(
    value,
    selectedCountry
  )
  if (parsedPhoneNumber !== undefined) return parsedPhoneNumber

  const parsedDigitOnlyInternationalPhoneNumber =
    parseDigitOnlyInternationalPhoneNumber(value, selectedCountry)
  if (parsedDigitOnlyInternationalPhoneNumber !== undefined)
    return parsedDigitOnlyInternationalPhoneNumber

  const nationalNumber = digitsOnly(value)

  return {
    nationalNumber,
    phoneNumber: toE164PhoneNumber(
      `${countryCallingCode(selectedCountry)}${nationalNumber}`
    ),
    selectedCountry,
  }
}
