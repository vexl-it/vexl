import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Option, Schema} from 'effect'
import {countryPrefixColumnOf, releaseLineOf} from './analyticsStateRules'

describe('releaseLineOf', () => {
  it('keeps the year and month of a CalVer version', () => {
    expect(
      releaseLineOf(Option.some(Schema.decodeSync(VersionString)('26.9.5')))
    ).toBe('26.9')
  })

  it('falls back to unknown', () => {
    expect(releaseLineOf(Option.none())).toBe('unknown')
  })
})

describe('countryPrefixColumnOf', () => {
  it('stores the prefix when the definition keeps country', () => {
    expect(countryPrefixColumnOf(true, Option.some(420))).toBe('420')
  })

  it('stores none when the header is missing', () => {
    expect(countryPrefixColumnOf(true, Option.none())).toBe('none')
  })

  it('stores none when the definition has storeCountry false', () => {
    expect(countryPrefixColumnOf(false, Option.some(420))).toBe('none')
  })
})
