import {
  GeocodingRecordId,
  GeocodingRecordWithContext,
} from '@vexl-next/geocoding-db/src/GeocodingDbService/domain'
import {Option, Schema} from 'effect'
import {
  buildGeocodePlaceId,
  buildLocalizedGeocodeAddresses,
  buildLocalizedSuggestAddresses,
  buildSuggestPlaceId,
  buildSuggestSecondRow,
  countryDisplayName,
  localizedName,
  parsePlaceId,
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
})

describe('place ids', () => {
  const id = Schema.decodeSync(GeocodingRecordId)('123')

  it('round trips a suggestion id', () => {
    const parsed = parsePlaceId(buildSuggestPlaceId(id))

    expect(Option.getOrThrow(parsed).id).toBe(id)
    expect(Option.getOrThrow(parsed).coordinates).toEqual(Option.none())
  })

  it('round trips a geocoded pin id with its coordinates', () => {
    const parsed = Option.getOrThrow(
      parsePlaceId(buildGeocodePlaceId(id, 50.07551, -14.43789))
    )
    const coordinates = Option.getOrThrow(parsed.coordinates)

    expect(parsed.id).toBe(id)
    expect(coordinates.latitude).toBeCloseTo(50.0755, 4)
    expect(coordinates.longitude).toBeCloseTo(-14.4379, 4)
  })

  it('rejects ids not issued by this service', () => {
    expect(parsePlaceId('ChIJi3lwCZyTC0cRkEAWZg-vAAQ')).toEqual(Option.none())
    expect(parsePlaceId('osm:abc')).toEqual(Option.none())
    expect(parsePlaceId('osm:1@200,0')).toEqual(Option.none())
  })
})
