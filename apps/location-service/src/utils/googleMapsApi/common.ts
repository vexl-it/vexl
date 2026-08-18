import {Schema} from 'effect'

export const GoogleResponseEnvelope = Schema.Struct({status: Schema.Unknown})

export const GoogleCoordinates = Schema.Struct({
  lat: Schema.Number,
  lng: Schema.Number,
})
