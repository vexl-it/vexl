import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {type MapValue, type MapValueWithRadius} from '../Map/brands'

export function locationSuggestionToMapValue(
  locationSuggestion: LocationSuggestion
): MapValue {
  return {
    placeId: locationSuggestion.userData.placeId,
    address: `${locationSuggestion.userData.suggestFirstRow}, ${locationSuggestion.userData.suggestSecondRow}`,
    latitude: locationSuggestion.userData.latitude,
    longitude: locationSuggestion.userData.longitude,
    viewport: locationSuggestion.userData.viewport,
  }
}

export function pickedLocationToOfferLocation({
  pickedLocation,
  latitude,
  longitude,
}: {
  readonly pickedLocation: MapValueWithRadius
  readonly latitude: OfferLocation['latitude']
  readonly longitude: OfferLocation['longitude']
}): OfferLocation {
  return {
    placeId: pickedLocation.placeId,
    address: pickedLocation.address,
    shortAddress: pickedLocation.address,
    radius: pickedLocation.radius,
    latitude,
    longitude,
  }
}
