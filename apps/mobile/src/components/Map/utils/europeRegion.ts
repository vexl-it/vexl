import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'

const europeRegion = {
  latitude: Latitude.parse(54.526), // Central latitude of Europe
  longitude: Longitude.parse(15.2551), // Central longitude of Europe
  latitudeDelta: 35, // These deltas represent the span of the region
  longitudeDelta: 50, // you want to display. Adjust as needed.
} as const

export default europeRegion
