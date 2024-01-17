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
  address: Address
  viewport: Viewport
} & LatLong
