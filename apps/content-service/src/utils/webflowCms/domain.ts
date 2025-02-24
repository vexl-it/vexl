import {Schema} from 'effect'

export const WebflowEventItem = Schema.Struct({
  id: Schema.String,
  cmsLocaleId: Schema.String,
  lastPublished: Schema.DateFromString,
  lastUpdated: Schema.DateFromString,
  createdOn: Schema.DateFromString,
  isArchived: Schema.Boolean,
  isDraft: Schema.Boolean,
  fieldData: Schema.Struct({
    'start-date-time': Schema.DateFromString,
    'event-link': Schema.String,
    'end-date-time': Schema.optionalWith(Schema.DateFromString, {as: 'Option'}),
    name: Schema.String,
    venue: Schema.String,
    'event-speakers': Schema.optionalWith(Schema.Array(Schema.String), {
      default: () => [],
    }),
    slug: Schema.String,
    'golden-glasses': Schema.optionalWith(Schema.Boolean, {
      default: () => false,
    }),
  }),
})
export type WebflowEventItem = typeof WebflowEventItem.Type

export const WebflowSpeakerItem = Schema.Struct({
  id: Schema.String,
  cmsLocaleId: Schema.String,
  lastPublished: Schema.DateFromString,
  lastUpdated: Schema.DateFromString,
  createdOn: Schema.DateFromString,
  isArchived: Schema.Boolean,
  isDraft: Schema.Boolean,
  fieldData: Schema.Struct({
    'link-to-socials': Schema.optionalWith(Schema.String, {as: 'Option'}),
    name: Schema.String,
    slug: Schema.String,
    'event-speaker-image': Schema.optionalWith(
      Schema.Struct({
        url: Schema.String,
      }),
      {as: 'Option'}
    ),
  }),
})

export type WebflowSpeakerItem = typeof WebflowSpeakerItem.Type

export const WebflowEventsResponse = Schema.Struct({
  items: Schema.Array(WebflowEventItem),
})

export type WebflowEventsResponse = typeof WebflowEventsResponse.Type

export const WebflowSpeakersResponse = Schema.Struct({
  items: Schema.Array(WebflowSpeakerItem),
})
export type WebflowSpeakersResponse = typeof WebflowSpeakersResponse.Type

export class WebflowFetchError extends Schema.TaggedError<WebflowFetchError>(
  'WebflowFetchError'
)('WebflowFetchError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}
