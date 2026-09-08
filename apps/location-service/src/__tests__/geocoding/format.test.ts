import {GeocodingRecordWithContext} from '@vexl-next/geocoding-db/src/GeocodingDbService/domain'
import {appLocaleCatalogs} from '@vexl-next/localization/src/translations'
import {Option, Schema} from 'effect'
import {MAX_LOCALIZED_LANGS} from '../../geocoding'
import {
  buildLocalizedGeocodeAddresses,
  buildLocalizedSuggestAddresses,
  buildSuggestSecondRow,
  countryDisplayName,
  localizedName,
} from '../../geocoding/format'

const record = Schema.decodeSync(GeocodingRecordWithContext)({
  id: '1',
  placeType: 'city',
  name: 'Default place name',
  names: {cs: 'Český název'},
  countryCode: 'cz',
  population: null,
  importance: 1,
  latitude: 50,
  longitude: 14,
  cityName: null,
  cityNames: null,
})

const langs = ['cs', 'de']

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

describe('localized address builders', () => {
  it('builds suggest addresses with the same first-row and second-row join', () => {
    const addresses = buildLocalizedSuggestAddresses(record, langs)

    expect(addresses.cs).toBe(
      `${localizedName(record.name, record.names, 'cs')}, ${buildSuggestSecondRow(record, 'cs')}`
    )
    expect(addresses.de).toBe(
      `Default place name, ${Option.getOrThrow(countryDisplayName(record.countryCode, 'de'))}`
    )
  })

  it('builds geocode addresses and falls back to the default place name', () => {
    const addresses = buildLocalizedGeocodeAddresses(record, langs)

    expect(addresses.cs).toBe('Český název - CZ')
    expect(addresses.de).toBe('Default place name - CZ')
  })

  it('keys the maps by exactly the requested languages', () => {
    expect(Object.keys(buildLocalizedSuggestAddresses(record, langs))).toEqual(
      langs
    )
  })

  it('renders an unknown valid language from the default place name', () => {
    expect(buildLocalizedGeocodeAddresses(record, ['xz'])).toEqual({
      xz: 'Default place name - CZ',
    })
  })

  it('caps langs above the shipped locale count so clients are never truncated', () => {
    expect(Object.keys(appLocaleCatalogs).length).toBeLessThanOrEqual(
      MAX_LOCALIZED_LANGS
    )
  })
})
