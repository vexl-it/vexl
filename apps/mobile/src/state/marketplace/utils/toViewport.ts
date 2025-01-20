import {
  Latitude,
  latitudeHelper,
  Longitude,
  longitudeHelper,
  type LatLong,
  type Radius,
  type Viewport,
} from '@vexl-next/domain/src/utility/geoCoordinates'

export function radiusToViewport(
  points: Array<{point: LatLong; radius: Radius}>
): Viewport | undefined {
  const firstPoint = points[0]

  if (!firstPoint) {
    return
  }

  // Initialize the bounding box with the first point's bounds
  let northeast = {
    latitude: latitudeHelper.add(firstPoint.point.latitude, firstPoint.radius),
    longitude: longitudeHelper.add(
      firstPoint.point.longitude,
      firstPoint.radius
    ),
  }
  let southwest = {
    latitude: latitudeHelper.subtract(
      firstPoint.point.latitude,
      firstPoint.radius
    ),
    longitude: longitudeHelper.subtract(
      firstPoint.point.longitude,
      firstPoint.radius
    ),
  }

  // Iterate through the remaining points to expand the bounds
  points.forEach(({point, radius}) => {
    northeast = {
      latitude: Latitude.parse(
        Math.max(northeast.latitude, latitudeHelper.add(point.latitude, radius))
      ),
      longitude: Longitude.parse(
        Math.max(
          northeast.longitude,
          longitudeHelper.add(point.longitude, radius)
        )
      ),
    }
    southwest = {
      latitude: Latitude.parse(
        Math.min(
          southwest.latitude,
          latitudeHelper.subtract(point.latitude, radius)
        )
      ),
      longitude: Longitude.parse(
        Math.min(
          southwest.longitude,
          longitudeHelper.subtract(point.longitude, radius)
        )
      ),
    }
  })

  // Calculate the center of the bounding box
  const center: LatLong = {
    latitude: Latitude.parse((northeast.latitude + southwest.latitude) / 2),
    longitude: Longitude.parse((northeast.longitude + southwest.longitude) / 2),
  }

  return {center, northeast, southwest}
}

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
