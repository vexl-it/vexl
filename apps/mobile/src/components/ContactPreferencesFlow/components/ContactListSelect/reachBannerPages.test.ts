import {
  getOpeningReachBannerPage,
  getPhonePrefixRegion,
  getReachBannerPages,
} from './reachBannerPages'

it.each([
  [100, 50, 24, ['network', 'offers', 'reach'], 'network'],
  [101, 50, 24, ['offers', 'network', 'reach'], 'offers'],
  [101, 50, 25, ['network', 'reach'], 'reach'],
  [101, 49, 0, ['network', 'reach'], 'reach'],
  [0, undefined, 0, ['network', 'reach'], 'network'],
  [101, 50, 100, ['network', 'reach'], 'reach'],
])(
  'chooses pages at reach/count thresholds (%s, %s, %s)',
  (reach, countryOffers, offersSeen, expectedPages, expectedOpening) => {
    const pages = getReachBannerPages({reach, countryOffers, offersSeen})
    expect(pages).toEqual(expectedPages)
    expect(getOpeningReachBannerPage(reach, pages)).toBe(expectedOpening)
  }
)

it('uses the phone calling prefix and identifies all shared prefixes rather than guessing a country', () => {
  expect(getPhonePrefixRegion('+420601111111')).toEqual({
    prefix: 420,
    country: 'CZ',
  })
  expect(getPhonePrefixRegion('+14155552671')).toEqual({
    prefix: 1,
    country: undefined,
  })
  expect(getPhonePrefixRegion('+79123456789')).toEqual({
    prefix: 7,
    country: undefined,
  })
  expect(getPhonePrefixRegion('+59995181234')).toEqual({
    prefix: 599,
    country: undefined,
  })
  expect(getPhonePrefixRegion('')).toBeUndefined()
})
