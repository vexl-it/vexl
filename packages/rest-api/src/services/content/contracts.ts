import {Schema} from 'effect'

export const Speaker = Schema.Struct({
  name: Schema.String,
  linkToSocials: Schema.optionalWith(Schema.String, {as: 'Option'}),
  imageUrl: Schema.optionalWith(Schema.String, {as: 'Option'}),
})
export type Speaker = typeof Speaker.Type

export const EventId = Schema.String.pipe(Schema.brand('EventId'))
export const Event = Schema.Struct({
  id: EventId,
  startDate: Schema.Date,
  endDate: Schema.optionalWith(Schema.Date, {as: 'Option'}),
  link: Schema.String,
  name: Schema.String,
  venue: Schema.String,
  speakers: Schema.Array(Speaker),
})
export type Event = typeof Event.Type

export const EventsResponse = Schema.Struct({
  events: Schema.Array(Event),
})

export class InvalidTokenError extends Schema.TaggedError<InvalidTokenError>(
  'InvalidTokenError'
)('InvalidTokenError', {
  status: Schema.optionalWith(Schema.Literal(401), {default: () => 401}),
}) {}

export const ClearEventsCacheErrors = Schema.Union(InvalidTokenError)

export type EventsResponse = typeof EventsResponse.Type

export const ClearEventsCacheRequest = Schema.Struct({
  token: Schema.String,
})
// export type ClearEventsCacheRequest = typeof ClearEventsCacheRequest.Type
