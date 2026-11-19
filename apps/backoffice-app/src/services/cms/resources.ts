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

type Call<A> = Effect.Effect<A, unknown>

/** One kind of CMS content, so posts and events share list and edit pages. */
export interface CmsResource<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
> {
  readonly path: string
  readonly list: (client: CmsAdminClient) => Call<readonly Item[]>
  readonly create: (client: CmsAdminClient, input: Input) => Call<Item>
  readonly update: (client: CmsAdminClient, id: Id, input: Input) => Call<Item>
  readonly setStatus: (
    client: CmsAdminClient,
    id: Id,
    status: CmsStatus
  ) => Call<Item>
  readonly remove: (client: CmsAdminClient, id: Id) => Call<unknown>
}

export const blogPostResource: CmsResource<BlogId, BlogPost, BlogPostInput> = {
  path: '/blog-posts',
  list: (client) =>
    client.listBlogPosts().pipe(Effect.map(({blogPosts}) => blogPosts)),
  create: (client, payload) => client.createBlogPost({payload}),
  update: (client, id, payload) => client.updateBlogPost({path: {id}, payload}),
  setStatus: (client, id, status) =>
    status === 'published'
      ? client.publishBlogPost({path: {id}})
      : client.unpublishBlogPost({path: {id}}),
  remove: (client, id) => client.deleteBlogPost({path: {id}}),
}

export const eventResource: CmsResource<EventId, CmsEvent, EventInput> = {
  path: '/events',
  list: (client) => client.listEvents().pipe(Effect.map(({events}) => events)),
  create: (client, payload) => client.createEvent({payload}),
  update: (client, id, payload) => client.updateEvent({path: {id}, payload}),
  setStatus: (client, id, status) =>
    status === 'published'
      ? client.publishEvent({path: {id}})
      : client.unpublishEvent({path: {id}}),
  remove: (client, id) => client.deleteEvent({path: {id}}),
}
