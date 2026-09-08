import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {
  englishLanguageCode,
  type LanguageCode,
} from '@vexl-next/domain/src/utility/LanguageCode.brand'
import {Array, Option, pipe} from 'effect'

export type OfferLocationLabelData = Pick<
  OfferLocation,
  'address' | 'shortAddress' | 'localizedAddresses'
>

const LABEL_LETTER_REGEX = /\p{L}/u

function getMeaningfulLocationLabelPart(label: string): string | null {
  const trimmed = label.trim()

  if (!LABEL_LETTER_REGEX.test(trimmed)) return null

  return trimmed
}

// English mirrors the UI translation fallback for languages the app does not
// ship, and beats showing the offer creator's language.
function getLocalizedLabelPart(
  location: OfferLocationLabelData,
  appLanguage: LanguageCode
): string | null {
  return (
    getMeaningfulLocationLabelPart(
      location.localizedAddresses?.[appLanguage] ?? ''
    ) ??
    getMeaningfulLocationLabelPart(
      location.localizedAddresses?.[englishLanguageCode] ?? ''
    )
  )
}

export function getLocationFullDisplayLabel(
  location: OfferLocationLabelData,
  appLanguage: LanguageCode
): string {
  const fallbackLabel = location.address.trim() || location.shortAddress.trim()

  return (
    getLocalizedLabelPart(location, appLanguage) ??
    getMeaningfulLocationLabelPart(location.address) ??
    getMeaningfulLocationLabelPart(location.shortAddress) ??
    fallbackLabel
  )
}

export function getLocationCompactDisplayLabel(
  location: OfferLocationLabelData,
  appLanguage: LanguageCode
): string {
  const localizedAddress = getLocalizedLabelPart(location, appLanguage)
  if (localizedAddress) return localizedAddress

  const shortAddress = getMeaningfulLocationLabelPart(location.shortAddress)
  if (shortAddress) return shortAddress

  return getLocationFullDisplayLabel(location, appLanguage)
}

export function getLocationFullDisplayLabels(
  locations: readonly OfferLocationLabelData[],
  appLanguage: LanguageCode
): readonly string[] {
  return pipe(
    locations,
    Array.map((location) => getLocationFullDisplayLabel(location, appLanguage))
  )
}

export function getLocationCompactDisplayLabelForLocations(
  locations: readonly OfferLocationLabelData[],
  appLanguage: LanguageCode
): string | null {
  const firstLocation = pipe(locations, Array.head, Option.getOrNull)
  if (!firstLocation) return null

  const locationLabel = getLocationCompactDisplayLabel(
    firstLocation,
    appLanguage
  )
  const extraLocationsCount = locations.length - 1

  return extraLocationsCount > 0
    ? `${locationLabel} +${String(extraLocationsCount)}`
    : locationLabel
}
