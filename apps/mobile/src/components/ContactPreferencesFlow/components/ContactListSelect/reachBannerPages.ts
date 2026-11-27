import {Array, pipe} from 'effect'
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js'

export type ReachBannerPage = 'offers' | 'network' | 'reach'

export function getReachBannerPages({
  reach,
  countryOffers,
  offersSeen,
}: {
  readonly reach: number
  readonly countryOffers: number | undefined
  readonly offersSeen: number
}): ReachBannerPage[] {
  const offers: ReachBannerPage[] =
    countryOffers !== undefined &&
    countryOffers >= 50 &&
    offersSeen < countryOffers / 2
      ? ['offers']
      : []
  return reach <= 100
    ? ['network', ...offers, 'reach']
    : [...offers, 'network', 'reach']
}

export function getOpeningReachBannerPage(
  reach: number,
  pages: readonly ReachBannerPage[]
): ReachBannerPage {
  return reach <= 100
    ? 'network'
    : Array.contains(pages, 'offers')
      ? 'offers'
      : 'reach'
}

export function getPhonePrefixRegion(
  phone: string
): {prefix: number; country: CountryCode | undefined} | undefined {
  const parsed = parsePhoneNumberFromString(phone)
  if (parsed === undefined) return undefined
  const countries = pipe(
    getCountries(),
    Array.filter(
      (country) => getCountryCallingCode(country) === parsed.countryCallingCode
    )
  )
  return {
    prefix: Number(parsed.countryCallingCode),
    country: countries.length === 1 ? countries[0] : undefined,
  }
}
