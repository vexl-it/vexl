import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {withNullishDefault} from '@vexl-next/generic-utils/src/effect-helpers/optionalNullable'
import {
  BlogId,
  BlogSlug,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, Option, Schema} from 'effect'

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
    'end-date-time': Schema.OptionFromOptionalNullOr(
      Schema.DateFromString
    ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
    name: Schema.String,
    venue: Schema.String,
    'event-speakers': withNullishDefault(Schema.Array(Schema.String), () => []),
    slug: Schema.String,
    'golden-glasses': withNullishDefault(Schema.Boolean, () => false),
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
    'link-to-socials': Schema.OptionFromOptionalNullOr(Schema.String).pipe(
      Schema.withConstructorDefault(Effect.succeed(Option.none()))
    ),
    name: Schema.String,
    slug: Schema.String,
    'event-speaker-image': Schema.OptionFromOptionalNullOr(
      Schema.Struct({
        url: Schema.String,
      })
    ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
  }),
})

export type WebflowSpeakerItem = typeof WebflowSpeakerItem.Type

export const WebflowBlogItem = Schema.Struct({
  id: BlogId,
  cmsLocaleId: Schema.String,
  lastPublished: Schema.DateFromString,
  lastUpdated: Schema.DateFromString,
  createdOn: Schema.DateFromString,
  isArchived: Schema.Boolean,
  isDraft: Schema.Boolean,
  fieldData: Schema.Struct({
    'teaser-text': Schema.OptionFromOptionalNullOr(Schema.String).pipe(
      Schema.withConstructorDefault(Effect.succeed(Option.none()))
    ),
    'rich-text': Schema.String,
    name: Schema.String,
    slug: BlogSlug,
    'main-image': Schema.OptionFromOptionalNullOr(
      Schema.Struct({
        url: UriString,
      })
    ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
  }),
})

export type WebflowBlogItem = typeof WebflowBlogItem.Type

export const WebflowEventsResponse = Schema.Struct({
  items: Schema.Array(WebflowEventItem),
})

export type WebflowEventsResponse = typeof WebflowEventsResponse.Type

export const WebflowSpeakersResponse = Schema.Struct({
  items: Schema.Array(WebflowSpeakerItem),
})
export type WebflowSpeakersResponse = typeof WebflowSpeakersResponse.Type

export const WebflowBlogsResponse = Schema.Struct({
  items: Schema.Array(WebflowBlogItem),
})
export type WebflowBlogsResponse = typeof WebflowBlogsResponse.Type

export class WebflowFetchError extends Schema.TaggedError<WebflowFetchError>(
  'WebflowFetchError'
)('WebflowFetchError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}
