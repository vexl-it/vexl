import {
  type BlogId,
  type BlogPost,
  type BlogPostInput,
  type CmsEvent,
  type CmsStatus,
  type EventId,
  type EventInput,
} from '@vexl-next/domain/src/general/cms'
import {Effect, Option} from 'effect'
import {type CmsAdminClient} from '../contentAdminApi'

type Call<A> = Effect.Effect<A, unknown>

/** One kind of CMS content, so posts and events share list and edit pages. */
export interface CmsResource<
  Id extends string,
  Item extends {readonly id: Id; readonly status: CmsStatus},
  Input,
> {
  readonly path: string
  /** Singular and plural, lowercase: "blog post", "blog posts". */
  readonly noun: string
  readonly nouns: string
  readonly name: (item: Item) => string
  /** Everything the list search looks through. */
  readonly searchText: (item: Item) => string
  /** A published item stays off the website until this date. */
  readonly visibleFrom?: (item: Item) => Date
  /** The item's page on the website, once it is live. */
  readonly publicUrl?: (item: Item) => string
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

/** The website's post URL, the same one content-service links to. */
export const blogPostPublicUrl = (slug: string): string =>
  `https://vexl.it/post/${slug}`

export const blogPostResource: CmsResource<BlogId, BlogPost, BlogPostInput> = {
  path: '/blog-posts',
  noun: 'blog post',
  nouns: 'blog posts',
  name: (post) => post.en.title,
  searchText: (post) =>
    [
      post.en.title,
      Option.match(post.cs, {onNone: () => '', onSome: (cs) => cs.title}),
      post.slug,
    ].join(' '),
  visibleFrom: (post) => post.publishedAt,
  publicUrl: (post) => blogPostPublicUrl(post.slug),
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
  noun: 'event',
  nouns: 'events',
  name: (event) => event.name,
  searchText: (event) => `${event.name} ${event.venue}`,
  list: (client) => client.listEvents().pipe(Effect.map(({events}) => events)),
  create: (client, payload) => client.createEvent({payload}),
  update: (client, id, payload) => client.updateEvent({path: {id}, payload}),
  setStatus: (client, id, status) =>
    status === 'published'
      ? client.publishEvent({path: {id}})
      : client.unpublishEvent({path: {id}}),
  remove: (client, id) => client.deleteEvent({path: {id}}),
}

/** True while a published item waits for its date. */
export const isScheduled = (
  status: CmsStatus,
  visibleFrom: Date | undefined
): boolean =>
  status === 'published' && !!visibleFrom && visibleFrom.getTime() > Date.now()
