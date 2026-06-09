import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe} from 'effect'

const LABEL_LETTER_REGEX = /\p{L}/u

function getMeaningfulLocationLabelPart(label: string): string | null {
  const trimmed = label.trim()

  if (!LABEL_LETTER_REGEX.test(trimmed)) return null

  return trimmed
}

export function getLocationFullDisplayLabel(
  location: Pick<OfferLocation, 'address' | 'shortAddress'>
): string {
  const fallbackLabel = location.address.trim() || location.shortAddress.trim()

  return (
    getMeaningfulLocationLabelPart(location.address) ??
    getMeaningfulLocationLabelPart(location.shortAddress) ??
    fallbackLabel
  )
}

export function getLocationCompactDisplayLabel(
  location: Pick<OfferLocation, 'address' | 'shortAddress'>
): string {
  const shortAddress = getMeaningfulLocationLabelPart(location.shortAddress)
  if (shortAddress) return shortAddress

  return getLocationFullDisplayLabel(location)
}

export function getLocationFullDisplayLabels(
  locations: ReadonlyArray<Pick<OfferLocation, 'address' | 'shortAddress'>>
): readonly string[] {
  return pipe(locations, Array.map(getLocationFullDisplayLabel))
}

export function getLocationCompactDisplayLabelForLocations(
  locations: ReadonlyArray<Pick<OfferLocation, 'address' | 'shortAddress'>>
): string | null {
  const firstLocation = pipe(locations, Array.head, Option.getOrNull)
  if (!firstLocation) return null

  const locationLabel = getLocationCompactDisplayLabel(firstLocation)
  const extraLocationsCount = locations.length - 1

  return extraLocationsCount > 0
    ? `${locationLabel} +${String(extraLocationsCount)}`
    : locationLabel
}
