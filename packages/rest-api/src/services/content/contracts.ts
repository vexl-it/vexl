import {HttpsUrlString} from '@vexl-next/domain/src/utility/HttpsUrlString.brand'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {UuidE} from '@vexl-next/domain/src/utility/Uuid.brand'
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
  goldenGlasses: Schema.optionalWith(Schema.Boolean, {default: () => false}),
})
export type Event = typeof Event.Type

export const EventsResponse = Schema.Struct({
  events: Schema.Array(Event),
})
export type EventsResponse = typeof EventsResponse.Type

export const BlogId = Schema.String.pipe(Schema.brand('BlogId'))
export const BlogSlug = Schema.String.pipe(Schema.brand('BlogSlug'))
export const BlogArticlePreview = Schema.Struct({
  id: BlogId,
  title: Schema.String,
  slug: BlogSlug,
  teaserText: Schema.optionalWith(Schema.String, {as: 'Option'}),
  mainImage: Schema.optionalWith(UriStringE, {as: 'Option'}),
  link: Schema.String,
  publishedOn: Schema.DateFromString,
})
export type BlogArticlePreview = typeof BlogArticlePreview.Type

export const BlogsArticlesResponse = Schema.Struct({
  articles: Schema.Array(BlogArticlePreview),
})
export type BlogsArticlesResponse = typeof BlogsArticlesResponse.Type

export class InvalidTokenError extends Schema.TaggedError<InvalidTokenError>(
  'InvalidTokenError'
)('InvalidTokenError', {
  status: Schema.optionalWith(Schema.Literal(401), {default: () => 401}),
}) {}

export const ClearEventsCacheErrors = Schema.Union(InvalidTokenError)

export const ClearEventsCacheRequest = Schema.Struct({
  token: Schema.String,
})

export const VexlBotNews = Schema.Struct({
  id: UuidE,
  content: Schema.String,
  type: Schema.Literal('info', 'warning'),
  action: Schema.Struct({
    text: Schema.String,
    url: HttpsUrlString,
  }).pipe(Schema.optionalWith({as: 'Option'})),
  cancelForever: Schema.Boolean,
  bubbleOrigin: Schema.optionalWith(
    Schema.Struct({
      title: Schema.String,
      subtitle: Schema.String,
    }),
    {as: 'Option'}
  ),
  cancelable: Schema.Boolean,
})
export type VexlBotNews = typeof VexlBotNews.Type

export const FullScreenWarning = Schema.Struct({
  id: UuidE,
  type: Schema.Literal('RED', 'YELLOW', 'GREEN'),
  title: Schema.String,
  description: Schema.String,
  cancelForever: Schema.Boolean,
  action: Schema.Struct({
    text: Schema.String,
    url: HttpsUrlString,
  }).pipe(Schema.optionalWith({as: 'Option'})),
  cancelable: Schema.Boolean,
})
export type FullScreenWarning = typeof FullScreenWarning.Type

export const NewsAndAnnouncementsResponse = Schema.Struct({
  vexlBotNews: Schema.Array(VexlBotNews),
  fullScreenWarning: Schema.optionalWith(FullScreenWarning, {as: 'Option'}),
})
export type NewsAndAnnouncementsResponse =
  typeof NewsAndAnnouncementsResponse.Type
