import {HttpApiBuilder} from '@effect/platform/index'
import {type BlogPost} from '@vexl-next/domain/src/general/cms'
import {type BlogArticlePreview} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, String} from 'effect'
import {vexlBlogUrlTemplateConfig} from '../configs'
import {BlogPostsDbService} from '../db/BlogPostsDbService'

const toBlogArticlePreview =
  (vexlBlogUrlTemplate: string) =>
  (post: BlogPost): BlogArticlePreview => ({
    id: post.id,
    publishedOn: post.publishedAt,
    title: post.en.title,
    slug: post.slug,
    link: String.replace('{slug}', post.slug)(vexlBlogUrlTemplate),
    teaserText: post.en.summary,
    mainImage: post.imageUrl,
  })

const listPublishedBlogPosts = BlogPostsDbService.pipe(
  Effect.flatMap((db) => db.listPublishedBlogPosts)
)

export const getBlogsHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Cms',
  'getBlogArticles',
  () =>
    Effect.gen(function* (_) {
      const posts = yield* _(listPublishedBlogPosts)
      const vexlBlogUrlTemplate = yield* _(vexlBlogUrlTemplateConfig)
      return {
        articles: Array.map(posts, toBlogArticlePreview(vexlBlogUrlTemplate)),
      }
    }).pipe(Effect.withSpan('getBlogs'), makeEndpointEffect)
)

export const getPublishedBlogPostsHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Cms',
  'getPublishedBlogPosts',
  () =>
    listPublishedBlogPosts.pipe(
      Effect.map((blogPosts) => ({blogPosts})),
      Effect.withSpan('getPublishedBlogPosts'),
      makeEndpointEffect
    )
)
