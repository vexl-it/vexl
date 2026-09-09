import {OfferLocation} from '@vexl-next/domain/src/general/offers'
import {appLocaleCatalogs} from '@vexl-next/localization/src/translations'
import {Schema} from 'effect'
import {needsLocalizedAddressesRefresh} from './needsLocalizedAddressesRefresh'

const allShipped = Object.fromEntries(
  Object.keys(appLocaleCatalogs).map((lang) => [lang, `Praha (${lang})`])
)

const location = (localizedAddresses?: Record<string, string>): OfferLocation =>
  Schema.decodeSync(OfferLocation)({
    placeId: 'osm:2',
    latitude: 50.0875,
    longitude: 14.4213,
    radius: 1,
    address: 'Praha, Czechia',
    shortAddress: 'Praha',
    localizedAddresses,
  })

describe('needsLocalizedAddressesRefresh', () => {
  it('is false when every shipped language is present', () => {
    expect(needsLocalizedAddressesRefresh(location(allShipped))).toBe(false)
    expect(
      needsLocalizedAddressesRefresh(location({...allShipped, xx: 'extra'}))
    ).toBe(false)
  })

  it('is true when any shipped language is missing', () => {
    const {en, ...withoutEn} = allShipped
    expect(needsLocalizedAddressesRefresh(location(withoutEn))).toBe(true)
  })

  it('is true when the map is absent', () => {
    expect(needsLocalizedAddressesRefresh(location())).toBe(true)
  })
})
