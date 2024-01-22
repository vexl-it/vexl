import {type LocationPlaceId} from '@vexl-next/domain/src/general/offers'
import {
  type Latitude,
  type Longitude,
  type Radius,
} from '@vexl-next/domain/src/utility/geoCoordinates'

export interface LatLong {
  latitude: Latitude
  longitude: Longitude
}

export interface Viewport {
  northeast: LatLong
  southwest: LatLong
}

export type Address = string

export type MapValue = {
  placeId: LocationPlaceId
  address: Address
  viewport: Viewport
} & LatLong

export type MapValueWithRadius = MapValue & {radius: Radius}
