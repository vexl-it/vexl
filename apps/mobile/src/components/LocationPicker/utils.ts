import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {
  latitudeHelper,
  longitudeHelper,
} from '@vexl-next/domain/src/utility/geoCoordinates'
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

export function offerLocationToMapValueWithRadius(
  offerLocation: OfferLocation
): MapValueWithRadius {
  return {
    placeId: offerLocation.placeId,
    address: offerLocation.address,
    latitude: offerLocation.latitude,
    longitude: offerLocation.longitude,
    radius: offerLocation.radius,
    viewport: {
      northeast: {
        latitude: latitudeHelper.add(
          offerLocation.latitude,
          offerLocation.radius
        ),
        longitude: longitudeHelper.add(
          offerLocation.longitude,
          offerLocation.radius
        ),
      },
      southwest: {
        latitude: latitudeHelper.subtract(
          offerLocation.latitude,
          offerLocation.radius
        ),
        longitude: longitudeHelper.subtract(
          offerLocation.longitude,
          offerLocation.radius
        ),
      },
    },
  }
}
