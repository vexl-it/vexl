import {
  BlogId,
  BlogSlug,
  CmsStatus,
  type BlogPost,
} from '@vexl-next/domain/src/general/cms'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Option, Schema} from 'effect'

export const BlogPostDbRecord = Schema.Struct({
  id: BlogId,
  slug: BlogSlug,
  status: CmsStatus,
  featured: Schema.Boolean,
  imageUrl: Schema.NullOr(UriString),
  publishedAt: Schema.DateFromSelf,
  createdAt: Schema.DateFromSelf,
  titleEn: Schema.String,
  summaryEn: Schema.NullOr(Schema.String),
  bodyEn: Schema.String,
  titleCs: Schema.NullOr(Schema.String),
  summaryCs: Schema.NullOr(Schema.String),
  bodyCs: Schema.NullOr(Schema.String),
})
export type BlogPostDbRecord = typeof BlogPostDbRecord.Type

export type BlogPostContentColumns = Omit<
  BlogPostDbRecord,
  'id' | 'status' | 'createdAt'
>

export const blogPostContentColumns = (
  post: Pick<
    BlogPost,
    'slug' | 'featured' | 'imageUrl' | 'publishedAt' | 'en' | 'cs'
  >
): BlogPostContentColumns => ({
  slug: post.slug,
  featured: post.featured,
  imageUrl: Option.getOrNull(post.imageUrl),
  publishedAt: post.publishedAt,
  titleEn: post.en.title,
  summaryEn: Option.getOrNull(post.en.summary),
  bodyEn: post.en.body,
  titleCs: post.cs.pipe(
    Option.map((cs) => cs.title),
    Option.getOrNull
  ),
  summaryCs: post.cs.pipe(
    Option.flatMap((cs) => cs.summary),
    Option.getOrNull
  ),
  bodyCs: post.cs.pipe(
    Option.map((cs) => cs.body),
    Option.getOrNull
  ),
})

export const blogPostToDbRecord = (post: BlogPost): BlogPostDbRecord => ({
  id: post.id,
  status: post.status,
  createdAt: post.createdAt,
  ...blogPostContentColumns(post),
})

export const blogPostFromDbRecord = (record: BlogPostDbRecord): BlogPost => ({
  id: record.id,
  slug: record.slug,
  status: record.status,
  featured: record.featured,
  imageUrl: Option.fromNullable(record.imageUrl),
  publishedAt: record.publishedAt,
  createdAt: record.createdAt,
  en: {
    title: record.titleEn,
    summary: Option.fromNullable(record.summaryEn),
    body: record.bodyEn,
  },
  cs: Option.all({
    title: Option.fromNullable(record.titleCs),
    body: Option.fromNullable(record.bodyCs),
  }).pipe(
    Option.map(({title, body}) => ({
      title,
      body,
      summary: Option.fromNullable(record.summaryCs),
    }))
  ),
})
