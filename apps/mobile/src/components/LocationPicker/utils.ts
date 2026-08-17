import {
  LocationPlaceId,
  type OfferLocation,
} from '@vexl-next/domain/src/general/offers'
import {
  latitudeHelper,
  longitudeHelper,
  type Latitude,
  type Longitude,
  type Radius,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {Schema} from 'effect'
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

const MANUAL_PLACE_ID_PREFIX = 'manual:'

export function isManualLocationPlaceId(
  placeId: LocationPlaceId | undefined
): boolean {
  return placeId?.startsWith(MANUAL_PLACE_ID_PREFIX) ?? false
}

export function mapCenterAndRadiusToViewport({
  latitude,
  longitude,
  radius,
}: {
  readonly latitude: Latitude
  readonly longitude: Longitude
  readonly radius: Radius
}): MapValue['viewport'] {
  return {
    northeast: {
      latitude: latitudeHelper.add(latitude, radius),
      longitude: longitudeHelper.add(longitude, radius),
    },
    southwest: {
      latitude: latitudeHelper.subtract(latitude, radius),
      longitude: longitudeHelper.subtract(longitude, radius),
    },
  }
}

export function manualAddressToMapValueWithRadius({
  address,
  latitude,
  longitude,
  radius,
}: {
  readonly address: string
  readonly latitude: Latitude
  readonly longitude: Longitude
  readonly radius: Radius
}): MapValueWithRadius {
  return {
    // Coordinates are rounded to ~1km cells so same-label locations in
    // different areas stay distinct. Must stay far coarser than the ~100m
    // randomizeLocation shift (OfferLocationRadiusScreen) to not reveal the
    // exact pin position.
    placeId: Schema.decodeSync(LocationPlaceId)(
      `${MANUAL_PLACE_ID_PREFIX}${latitude.toFixed(2)},${longitude.toFixed(2)}:${address}`
    ),
    address,
    latitude,
    longitude,
    radius,
    viewport: mapCenterAndRadiusToViewport({latitude, longitude, radius}),
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
    viewport: mapCenterAndRadiusToViewport(offerLocation),
  }
}
