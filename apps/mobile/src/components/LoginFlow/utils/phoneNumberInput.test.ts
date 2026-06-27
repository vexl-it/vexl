import {Option} from 'effect'
import {getCountryByCca2, type ICountry} from 'react-native-country-select'
import {
  countryCallingCode,
  parsePhoneNumberInput,
  splitNationalNumberIntoGroups,
} from './phoneNumberInput'

function country(countryCode: string): ICountry {
  const country = getCountryByCca2(countryCode)
  if (country === undefined) throw new Error(`Missing country ${countryCode}`)

  return country
}

function phoneNumberValue(
  phoneNumber: ReturnType<typeof parsePhoneNumberInput>['phoneNumber']
): string | undefined {
  return Option.isSome(phoneNumber) ? phoneNumber.value : undefined
}

describe('countryCallingCode', () => {
  it('builds the full calling code from root and suffix', () => {
    expect(countryCallingCode(country('AI'))).toBe('+1264')
  })

  it('keeps the fallback for a missing country', () => {
    expect(countryCallingCode(undefined)).toBe('+420')
  })
})

describe('parsePhoneNumberInput', () => {
  it('keeps typed national digits under the selected country', () => {
    const result = parsePhoneNumberInput('777 123 456', country('CZ'))

    expect(result.selectedCountry?.cca2).toBe('CZ')
    expect(result.nationalNumber).toBe('777123456')
    expect(phoneNumberValue(result.phoneNumber)).toBe('+420777123456')
  })

  it('accepts a pasted international number and updates the selected country', () => {
    const result = parsePhoneNumberInput('+421 901 123 456', country('CZ'))

    expect(result.selectedCountry?.cca2).toBe('SK')
    expect(result.nationalNumber).toBe('901123456')
    expect(phoneNumberValue(result.phoneNumber)).toBe('+421901123456')
  })

  it('accepts a pasted international number without a plus when it is longer than the selected national number', () => {
    const result = parsePhoneNumberInput('421 901 123 456', country('CZ'))

    expect(result.selectedCountry?.cca2).toBe('SK')
    expect(result.nationalNumber).toBe('901123456')
    expect(phoneNumberValue(result.phoneNumber)).toBe('+421901123456')
  })

  it('accepts a 00-prefixed pasted international number', () => {
    const result = parsePhoneNumberInput('00421 901 123 456', country('CZ'))

    expect(result.selectedCountry?.cca2).toBe('SK')
    expect(result.nationalNumber).toBe('901123456')
    expect(phoneNumberValue(result.phoneNumber)).toBe('+421901123456')
  })

  it('uses the pasted number if it was inserted after existing input', () => {
    const result = parsePhoneNumberInput('777+421 901 123 456', country('CZ'))

    expect(result.selectedCountry?.cca2).toBe('SK')
    expect(result.nationalNumber).toBe('901123456')
    expect(phoneNumberValue(result.phoneNumber)).toBe('+421901123456')
  })

  it('uses a 00-prefixed pasted number if it was inserted after existing input', () => {
    const result = parsePhoneNumberInput('77700421901123456', country('CZ'))

    expect(result.selectedCountry?.cca2).toBe('SK')
    expect(result.nationalNumber).toBe('901123456')
    expect(phoneNumberValue(result.phoneNumber)).toBe('+421901123456')
  })

  it('uses a digit-only pasted number if it was inserted after existing input', () => {
    const result = parsePhoneNumberInput('777421901123456', country('CZ'))

    expect(result.selectedCountry?.cca2).toBe('SK')
    expect(result.nationalNumber).toBe('901123456')
    expect(phoneNumberValue(result.phoneNumber)).toBe('+421901123456')
  })

  it('keeps incomplete input editable', () => {
    const result = parsePhoneNumberInput('777', country('CZ'))

    expect(result.selectedCountry?.cca2).toBe('CZ')
    expect(result.nationalNumber).toBe('777')
    expect(phoneNumberValue(result.phoneNumber)).toBeUndefined()
  })
})

describe('splitNationalNumberIntoGroups', () => {
  it('keeps the selected country grouping', () => {
    expect(splitNationalNumberIntoGroups('777123456', country('CZ'))).toEqual([
      '777',
      '123',
      '456',
    ])
  })
})
