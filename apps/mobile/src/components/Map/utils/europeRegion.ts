import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Schema} from 'effect/index'

const europeRegion = {
  latitude: Schema.decodeSync(Latitude)(54.526), // Central latitude of Europe
  longitude: Schema.decodeSync(Longitude)(15.2551), // Central longitude of Europe
  latitudeDelta: 35, // These deltas represent the span of the region
  longitudeDelta: 50, // you want to display. Adjust as needed.
} as const

export default europeRegion
