import {type LocationPlaceId} from '@vexl-next/domain/src/general/offers'
import {
  type Latitude,
  type Longitude,
  type Radius,
} from '@vexl-next/domain/src/utility/geoCoordinates'

interface LatLong {
  latitude: Latitude
  longitude: Longitude
}

interface Viewport {
  northeast: LatLong
  southwest: LatLong
}

type Address = string

export type MapValue = {
  placeId: LocationPlaceId
  address: Address
  viewport: Viewport
} & LatLong

export type MapValueWithRadius = MapValue & {radius: Radius}
