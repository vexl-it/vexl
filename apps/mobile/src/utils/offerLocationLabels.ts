import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe} from 'effect'

function isMeaningfulShortAddress(shortAddress: string): boolean {
  const trimmed = shortAddress.trim()

  if (trimmed.length === 0) return false

  return !/^[\d\p{P}\p{S}\s]+$/u.test(trimmed)
}

export function getLocationFullDisplayLabel(
  location: Pick<OfferLocation, 'address' | 'shortAddress'>
): string {
  return location.address.trim() || location.shortAddress.trim()
}

export function getLocationCompactDisplayLabel(
  location: Pick<OfferLocation, 'address' | 'shortAddress'>
): string {
  if (isMeaningfulShortAddress(location.shortAddress)) {
    return location.shortAddress.trim()
  }

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
