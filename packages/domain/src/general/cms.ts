import {Schema} from 'effect'
import {UriString} from '../utility/UriString.brand'

export const CmsStatus = Schema.Literal('draft', 'published')
export type CmsStatus = typeof CmsStatus.Type

export const BlogId = Schema.String.pipe(Schema.brand('BlogId'))
export type BlogId = typeof BlogId.Type

export const BlogSlug = Schema.String.pipe(Schema.brand('BlogSlug'))
export type BlogSlug = typeof BlogSlug.Type

/** Body is HTML. */
export const BlogPostContent = Schema.Struct({
  title: Schema.String,
  summary: Schema.optionalWith(Schema.String, {as: 'Option'}),
  body: Schema.String,
})
export type BlogPostContent = typeof BlogPostContent.Type

/** What an editor writes. New and edited posts need both languages. */
export const BlogPostInput = Schema.Struct({
  slug: BlogSlug,
  featured: Schema.Boolean,
  imageUrl: Schema.optionalWith(UriString, {as: 'Option'}),
  publishedAt: Schema.Date,
  en: BlogPostContent,
  cs: BlogPostContent,
})
export type BlogPostInput = typeof BlogPostInput.Type

export const BlogPost = Schema.Struct({
  ...BlogPostInput.fields,
  id: BlogId,
  status: CmsStatus,
  createdAt: Schema.Date,
  /** None: not on the Czech site. Legacy posts may be English-only. */
  cs: Schema.optionalWith(BlogPostContent, {as: 'Option'}),
})
export type BlogPost = typeof BlogPost.Type

export const EventId = Schema.String.pipe(Schema.brand('EventId'))
export type EventId = typeof EventId.Type

export const Speaker = Schema.Struct({
  name: Schema.String,
  linkToSocials: Schema.optionalWith(Schema.String, {as: 'Option'}),
  imageUrl: Schema.optionalWith(Schema.String, {as: 'Option'}),
})
export type Speaker = typeof Speaker.Type

export const EventInput = Schema.Struct({
  name: Schema.String,
  venue: Schema.String,
  link: Schema.String,
  startDate: Schema.Date,
  endDate: Schema.optionalWith(Schema.Date, {as: 'Option'}),
  goldenGlasses: Schema.Boolean,
  speakers: Schema.Array(Speaker),
})
export type EventInput = typeof EventInput.Type

export const CmsEvent = Schema.Struct({
  ...EventInput.fields,
  id: EventId,
  status: CmsStatus,
})
export type CmsEvent = typeof CmsEvent.Type
