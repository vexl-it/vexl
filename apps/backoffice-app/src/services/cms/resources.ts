import {
  type BlogId,
  type BlogPost,
  type BlogPostInput,
  type CmsEvent,
  type CmsStatus,
  type EventId,
  type EventInput,
} from '@vexl-next/domain/src/general/cms'
import {Effect} from 'effect'
import {type CmsAdminClient} from '../contentAdminApi'

export interface AdminTokenHeaders {
  readonly 'x-admin-token': string
}

type Call<A> = Effect.Effect<A, unknown>

/** One kind of CMS content, so posts and events share list and edit pages. */
export interface CmsResource<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
> {
  readonly path: string
  readonly list: (
    client: CmsAdminClient,
    headers: AdminTokenHeaders
  ) => Call<readonly Item[]>
  readonly create: (
    client: CmsAdminClient,
    headers: AdminTokenHeaders,
    input: Input
  ) => Call<Item>
  readonly update: (
    client: CmsAdminClient,
    headers: AdminTokenHeaders,
    id: Id,
    input: Input
  ) => Call<Item>
  readonly setStatus: (
    client: CmsAdminClient,
    headers: AdminTokenHeaders,
    id: Id,
    status: CmsStatus
  ) => Call<Item>
  readonly remove: (
    client: CmsAdminClient,
    headers: AdminTokenHeaders,
    id: Id
  ) => Call<unknown>
}

export const blogPostResource: CmsResource<BlogId, BlogPost, BlogPostInput> = {
  path: '/blog-posts',
  list: (client, headers) =>
    client
      .listBlogPosts({headers})
      .pipe(Effect.map(({blogPosts}) => blogPosts)),
  create: (client, headers, payload) =>
    client.createBlogPost({headers, payload}),
  update: (client, headers, id, payload) =>
    client.updateBlogPost({headers, path: {id}, payload}),
  setStatus: (client, headers, id, status) =>
    status === 'published'
      ? client.publishBlogPost({headers, path: {id}})
      : client.unpublishBlogPost({headers, path: {id}}),
  remove: (client, headers, id) => client.deleteBlogPost({headers, path: {id}}),
}

export const eventResource: CmsResource<EventId, CmsEvent, EventInput> = {
  path: '/events',
  list: (client, headers) =>
    client.listEvents({headers}).pipe(Effect.map(({events}) => events)),
  create: (client, headers, payload) => client.createEvent({headers, payload}),
  update: (client, headers, id, payload) =>
    client.updateEvent({headers, path: {id}, payload}),
  setStatus: (client, headers, id, status) =>
    status === 'published'
      ? client.publishEvent({headers, path: {id}})
      : client.unpublishEvent({headers, path: {id}}),
  remove: (client, headers, id) => client.deleteEvent({headers, path: {id}}),
}
