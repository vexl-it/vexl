import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type BlogArticlePreview,
  type BlogsArticlesResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Option, String} from 'effect'
import {vexlBlogUrlTemplateConfig} from '../configs'
import {CacheService} from '../utils/cache'
import {WebflowCmsService} from '../utils/webflowCms'
import {type WebflowBlogItem} from '../utils/webflowCms/domain'

const webflowBlogToBlogArticlesResponse = (
  blogs: readonly WebflowBlogItem[],
  vexlBlogUrltemplate: string
): BlogArticlePreview[] =>
  Array.map(
    blogs,
    (blog) =>
      ({
        id: blog.id,
        publishedOn: blog.lastPublished,
        title: blog.fieldData.name,
        slug: blog.fieldData.slug,
        link: String.replace(
          '{slug}',
          blog.fieldData.slug
        )(vexlBlogUrltemplate),
        teaserText: blog.fieldData['teaser-text'],
        mainImage: blog.fieldData['main-image'].pipe(Option.map((o) => o.url)),
      }) satisfies BlogArticlePreview
  )

export const getBlogsHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Cms',
  'getBlogArticles',
  () =>
    Effect.gen(function* (_) {
      const cache = yield* _(CacheService)

      const data = yield* _(cache.getBlogsFromRedis)
      if (Option.isSome(data)) {
        yield* _(
          Effect.logInfo(
            'Got events cached in redis, not fetching from webflow'
          )
        )
        return data.value
      }

      yield* _(Effect.logInfo('No events in redis, fetching from webflow'))

      const webflowService = yield* _(WebflowCmsService)
      const blogs = yield* _(webflowService.fetchBlogs())

      return {
        articles: webflowBlogToBlogArticlesResponse(
          blogs.items,
          yield* _(vexlBlogUrlTemplateConfig)
        ),
      } satisfies BlogsArticlesResponse
    }).pipe(
      Effect.mapError(
        (e) =>
          new UnexpectedServerError({
            cause: e,
            status: 500,
          })
      ),
      Effect.tap((data) =>
        CacheService.pipe(
          Effect.flatMap((cache) => cache.saveBlogsToCacheForked(data))
        )
      ),
      Effect.withSpan('getBlogs'),
      makeEndpointEffect
    )
)
