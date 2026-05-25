import {
  latitudeHelper,
  longitudeHelper,
  type LatLong,
  type Viewport,
} from '@vexl-next/domain/src/utility/geoCoordinates'

export function deltasToViewport({
  point,
  latitudeDelta,
  longitudeDelta,
}: {
  point: LatLong
  latitudeDelta: number
  longitudeDelta: number
}): Viewport {
  return {
    center: point,
    northeast: {
      latitude: latitudeHelper.add(point.latitude, latitudeDelta / 2),
      longitude: longitudeHelper.add(point.longitude, longitudeDelta / 2),
    },
    southwest: {
      latitude: latitudeHelper.subtract(point.latitude, latitudeDelta / 2),
      longitude: longitudeHelper.subtract(point.longitude, longitudeDelta / 2),
    },
  }
}
