import {Option} from 'effect'
import {countryDisplayName} from '../../geocoding/format'

describe('countryDisplayName', () => {
  it('resolves a well-formed region code to its display name', () => {
    expect(countryDisplayName(Option.some('cz'), 'en')).toEqual(
      Option.some('Czechia')
    )
  })

  it('falls back to the raw uppercased code when Intl.DisplayNames throws on a malformed code', () => {
    expect(countryDisplayName(Option.some('123'), 'en')).toEqual(
      Option.some('123')
    )
    expect(countryDisplayName(Option.some(''), 'en')).toEqual(Option.some(''))
  })

  it('passes through Option.none', () => {
    expect(countryDisplayName(Option.none(), 'en')).toEqual(Option.none())
  })
})
