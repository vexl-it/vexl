import {type LocationPlaceId} from '@vexl-next/domain/src/general/offers'

export interface LatLong {
  latitude: number
  longitude: number
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
