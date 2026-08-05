import {type LngLatBounds} from '@maplibre/maplibre-react-native'

export interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

export interface LatLng {
  latitude: number
  longitude: number
}

export interface EdgePadding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface RegionChangeDetails {
  isGesture: boolean
}

export interface MapCameraControls {
  fitBounds: (bounds: LngLatBounds, options?: {padding?: EdgePadding}) => void
}
