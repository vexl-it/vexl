import {HttpApiBuilder} from '@effect/platform/index'
import {
  BlogId,
  type BlogPost,
  type CmsStatus,
} from '@vexl-next/domain/src/general/cms'
import {
  type NotFoundError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {type InvalidContentAdminTokenError} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentInternalApiSpecification} from '@vexl-next/rest-api/src/services/content/internalSpecification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option, Schema} from 'effect'
import {BlogPostsDbService} from '../../db/BlogPostsDbService'
import {validateAdminToken} from '../validateAdminToken'
import {orNotFound} from './orNotFound'

export const createBlogPostHandler = HttpApiBuilder.handler(
  ContentInternalApiSpecification,
  'Cms',
  'createBlogPost',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.headers[HEADER_ADMIN_TOKEN]))
      const post: BlogPost = {
        ...req.payload,
        cs: Option.some(req.payload.cs),
        id: Schema.decodeSync(BlogId)(generateUuid()),
        status: 'draft',
        createdAt: new Date(),
      }
      yield* _(
        BlogPostsDbService,
        Effect.flatMap((db) => db.insertBlogPost(post))
      )
      return post
    }).pipe(Effect.withSpan('createBlogPost'), makeEndpointEffect)
)

export const updateBlogPostHandler = HttpApiBuilder.handler(
  ContentInternalApiSpecification,
  'Cms',
  'updateBlogPost',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.headers[HEADER_ADMIN_TOKEN]))
      return yield* _(
        BlogPostsDbService,
        Effect.flatMap((db) =>
          db.updateBlogPost({id: req.path.id, input: req.payload})
        ),
        orNotFound
      )
    }).pipe(Effect.withSpan('updateBlogPost'), makeEndpointEffect)
)

const setBlogPostStatus = (
  adminToken: string,
  id: BlogId,
  status: CmsStatus
): Effect.Effect<
  BlogPost,
  InvalidContentAdminTokenError | UnexpectedServerError | NotFoundError,
  BlogPostsDbService
> =>
  Effect.gen(function* (_) {
    yield* _(validateAdminToken(adminToken))
    return yield* _(
      BlogPostsDbService,
      Effect.flatMap((db) => db.setBlogPostStatus({id, status})),
      orNotFound
    )
  }).pipe(Effect.withSpan('setBlogPostStatus'), makeEndpointEffect)

export const publishBlogPostHandler = HttpApiBuilder.handler(
  ContentInternalApiSpecification,
  'Cms',
  'publishBlogPost',
  (req) =>
    setBlogPostStatus(req.headers[HEADER_ADMIN_TOKEN], req.path.id, 'published')
)

export const unpublishBlogPostHandler = HttpApiBuilder.handler(
  ContentInternalApiSpecification,
  'Cms',
  'unpublishBlogPost',
  (req) =>
    setBlogPostStatus(req.headers[HEADER_ADMIN_TOKEN], req.path.id, 'draft')
)

export const deleteBlogPostHandler = HttpApiBuilder.handler(
  ContentInternalApiSpecification,
  'Cms',
  'deleteBlogPost',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.headers[HEADER_ADMIN_TOKEN]))
      yield* _(
        BlogPostsDbService,
        Effect.flatMap((db) => db.deleteBlogPost(req.path.id)),
        orNotFound
      )
      return {}
    }).pipe(Effect.withSpan('deleteBlogPost'), makeEndpointEffect)
)
