import {SqlClient, SqlSchema} from '@effect/sql'
import {type SqlError} from '@effect/sql/SqlError'
import {
  BlogId,
  CmsStatus,
  type BlogPost,
  type BlogPostInput,
} from '@vexl-next/domain/src/general/cms'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {BlogSlugTakenError} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, Context, Effect, flow, Layer, Option, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {isUniqueViolation} from '../isUniqueViolation'
import {
  blogPostContentColumns,
  BlogPostDbRecord,
  blogPostFromDbRecord,
  blogPostToDbRecord,
} from './domain'

const mapWriteError = (
  e: SqlError | ParseError
): BlogSlugTakenError | UnexpectedServerError =>
  e._tag === 'SqlError' && isUniqueViolation(e, 'blog_posts_slug_key')
    ? new BlogSlugTakenError()
    : new UnexpectedServerError({status: 500, cause: e})

export interface BlogPostsDbOperations {
  insertBlogPost: (
    post: BlogPost
  ) => Effect.Effect<void, BlogSlugTakenError | UnexpectedServerError>
  updateBlogPost: (params: {
    id: BlogId
    input: BlogPostInput
  }) => Effect.Effect<
    Option.Option<BlogPost>,
    BlogSlugTakenError | UnexpectedServerError
  >
  setBlogPostStatus: (params: {
    id: BlogId
    status: CmsStatus
  }) => Effect.Effect<Option.Option<BlogPost>, UnexpectedServerError>
  deleteBlogPost: (
    id: BlogId
  ) => Effect.Effect<Option.Option<unknown>, UnexpectedServerError>
  listPublishedBlogPosts: Effect.Effect<
    readonly BlogPost[],
    UnexpectedServerError
  >
  listAllBlogPosts: Effect.Effect<readonly BlogPost[], UnexpectedServerError>
}

export class BlogPostsDbService extends Context.Tag('BlogPostsDbService')<
  BlogPostsDbService,
  BlogPostsDbOperations
>() {
  static readonly Live = Layer.effect(
    BlogPostsDbService,
    Effect.gen(function* (_) {
      const sql = yield* _(SqlClient.SqlClient)

      const setBlogPostStatus = SqlSchema.findOne({
        Request: Schema.Struct({id: BlogId, status: CmsStatus}),
        Result: BlogPostDbRecord,
        execute: ({id, status}) => sql`
          UPDATE blog_posts
          SET
            status = ${status},
            updated_at = now()
          WHERE
            id = ${id}
          RETURNING
            *
        `,
      })

      const deleteBlogPost = SqlSchema.findOne({
        Request: BlogId,
        Result: Schema.Struct({id: BlogId}),
        execute: (id) => sql`
          DELETE FROM blog_posts
          WHERE
            id = ${id}
          RETURNING
            id
        `,
      })

      const listPublishedBlogPosts = SqlSchema.findAll({
        Request: Schema.Void,
        Result: BlogPostDbRecord,
        execute: () => sql`
          SELECT
            *
          FROM
            blog_posts
          WHERE
            status = 'published'
          ORDER BY
            created_at DESC
        `,
      })

      const listAllBlogPosts = SqlSchema.findAll({
        Request: Schema.Void,
        Result: BlogPostDbRecord,
        execute: () => sql`
          SELECT
            *
          FROM
            blog_posts
          ORDER BY
            created_at DESC
        `,
      })

      return {
        insertBlogPost: (post) =>
          sql`
            INSERT INTO
              blog_posts ${sql.insert(blogPostToDbRecord(post))}
          `.pipe(
            Effect.mapError(mapWriteError),
            Effect.withSpan('insertBlogPost query')
          ),
        updateBlogPost: ({id, input}) =>
          sql`
            UPDATE blog_posts
            SET
              ${sql.update(
              blogPostContentColumns({...input, cs: Option.some(input.cs)})
            )},
              updated_at = now()
            WHERE
              id = ${id}
            RETURNING
              *
          `.pipe(
            Effect.flatMap(
              Schema.decodeUnknown(Schema.Array(BlogPostDbRecord))
            ),
            Effect.map(flow(Array.head, Option.map(blogPostFromDbRecord))),
            Effect.mapError(mapWriteError),
            Effect.withSpan('updateBlogPost query')
          ),
        setBlogPostStatus: flow(
          setBlogPostStatus,
          Effect.map(Option.map(blogPostFromDbRecord)),
          UnexpectedServerError.wrapErrors('Error in setBlogPostStatus query'),
          Effect.withSpan('setBlogPostStatus query')
        ),
        deleteBlogPost: flow(
          deleteBlogPost,
          UnexpectedServerError.wrapErrors('Error in deleteBlogPost query'),
          Effect.withSpan('deleteBlogPost query')
        ),
        listPublishedBlogPosts: listPublishedBlogPosts().pipe(
          Effect.map(Array.map(blogPostFromDbRecord)),
          UnexpectedServerError.wrapErrors(
            'Error in listPublishedBlogPosts query'
          ),
          Effect.withSpan('listPublishedBlogPosts query')
        ),
        listAllBlogPosts: listAllBlogPosts().pipe(
          Effect.map(Array.map(blogPostFromDbRecord)),
          UnexpectedServerError.wrapErrors('Error in listAllBlogPosts query'),
          Effect.withSpan('listAllBlogPosts query')
        ),
      }
    })
  )
}
