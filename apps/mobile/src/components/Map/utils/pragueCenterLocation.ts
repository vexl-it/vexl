import {LocationPlaceId} from '@vexl-next/domain/src/general/offers'
import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Schema} from 'effect'
import {type MapValue} from '../brands'

export const pragueCenterLocation: MapValue = {
  placeId: Schema.decodeSync(LocationPlaceId)('prague-default-location'),
  address: 'Prague',
  latitude: Schema.decodeSync(Latitude)(50.0755),
  longitude: Schema.decodeSync(Longitude)(14.4378),
  viewport: {
    northeast: {
      latitude: Schema.decodeSync(Latitude)(50.0955),
      longitude: Schema.decodeSync(Longitude)(14.4578),
    },
    southwest: {
      latitude: Schema.decodeSync(Latitude)(50.0555),
      longitude: Schema.decodeSync(Longitude)(14.4178),
    },
  },
}
