// One-time export of the published Webflow CMS into webflowSnapshot.json.
// Run: WEBFLOW_TOKEN=... pnpm export:webflow (cms:read token is enough)
// Then upload the images listed in cmsImages.tsv with uploadCmsImages.sh.
import {NodeRuntime} from '@effect/platform-node'
import {
  BlogId,
  BlogSlug,
  EventId,
  type BlogPost,
  type BlogPostContent,
  type CmsEvent,
  type Speaker,
} from '@vexl-next/domain/src/general/cms'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Array, Config, Effect, Option, pipe, Redacted, Schema} from 'effect'
import matter from 'gray-matter'
import {marked} from 'marked'
import {execFileSync} from 'node:child_process'
import {writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {CmsSnapshot} from './importCmsSnapshot'

const BLOG_COLLECTION_ID = '665e29df489d9ea047ef6c0c'
const EVENTS_COLLECTION_ID = '677fdfdaffac39a81e41b693'
const SPEAKERS_COLLECTION_ID = '677fe018a40f8ebc562d66df'
const WEBSITE_BLOG_DIR = 'apps/vexl-website/content/blog'
const RESOURCES_BASE_URL = 'https://resources.vexl.it'
const WEBFLOW_FILE_URL =
  /https:\/\/(?:cdn\.prod\.website-files\.com|uploads-ssl\.webflow\.com)\/[^"'\s<>]+/g

class ExportError extends Schema.TaggedError<ExportError>('ExportError')(
  'ExportError',
  {message: Schema.String, cause: Schema.optional(Schema.Unknown)}
) {}

const WebflowImage = Schema.NullOr(Schema.Struct({url: Schema.String}))

const WebflowBlogItem = Schema.Struct({
  id: BlogId,
  createdOn: Schema.Date,
  lastPublished: Schema.Date,
  fieldData: Schema.Struct({
    name: Schema.String,
    slug: BlogSlug,
    'teaser-text': Schema.optional(Schema.NullOr(Schema.String)),
    'rich-text': Schema.optional(Schema.NullOr(Schema.String)),
    'main-image': Schema.optional(WebflowImage),
    'featured-article': Schema.optional(Schema.NullOr(Schema.Boolean)),
  }),
})

const WebflowEventItem = Schema.Struct({
  id: EventId,
  fieldData: Schema.Struct({
    name: Schema.String,
    venue: Schema.String,
    'event-link': Schema.String,
    'start-date-time': Schema.Date,
    'end-date-time': Schema.optional(Schema.NullOr(Schema.Date)),
    'golden-glasses': Schema.optional(Schema.NullOr(Schema.Boolean)),
    'event-speakers': Schema.optional(
      Schema.NullOr(Schema.Array(Schema.String))
    ),
  }),
})

const WebflowSpeakerItem = Schema.Struct({
  id: Schema.String,
  fieldData: Schema.Struct({
    name: Schema.String,
    'link-to-socials': Schema.optional(Schema.NullOr(Schema.String)),
    'event-speaker-image': Schema.optional(WebflowImage),
  }),
})

const WebflowPage = Schema.Struct({
  items: Schema.Array(Schema.Unknown),
  pagination: Schema.Struct({total: Schema.Number}),
})

const WebsiteFrontmatter = Schema.Struct({
  cs: Schema.optional(Schema.Unknown),
})

const WebsiteTranslation = Schema.Struct({
  title: Schema.String,
  summary: Schema.String,
})

const fetchJson = (
  url: string,
  token: Redacted.Redacted
): Effect.Effect<unknown, ExportError> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, {
        headers: {Authorization: `Bearer ${Redacted.value(token)}`},
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    },
    catch: (cause) =>
      new ExportError({message: `Failed to fetch ${url}`, cause}),
  })

/** Only published items: /items/live never returns drafts or staged edits. */
const fetchLiveItems = <A, I>(
  collectionId: string,
  schema: Schema.Schema<A, I>,
  token: Redacted.Redacted
): Effect.Effect<readonly A[], ExportError> =>
  Effect.gen(function* (_) {
    const limit = 100
    const items: unknown[] = []
    let total = Infinity
    while (items.length < total) {
      const page = yield* _(
        fetchJson(
          `https://api.webflow.com/v2/collections/${collectionId}/items/live?limit=${limit}&offset=${items.length}`,
          token
        ),
        Effect.flatMap(Schema.decodeUnknown(WebflowPage))
      )
      total = page.pagination.total
      if (!Array.isNonEmptyReadonlyArray(page.items)) break
      items.push(...page.items)
    }
    return yield* _(Schema.decodeUnknown(Schema.Array(schema))(items))
  }).pipe(
    Effect.mapError(
      (cause) =>
        new ExportError({message: `Failed to export ${collectionId}`, cause})
    )
  )

const git = (...args: string[]): string =>
  execFileSync('git', args, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024})

/** Webflow file names start with a unique 24 hex file id. */
const resourceKeyFor = (url: string): Effect.Effect<string, ExportError> => {
  const fileName = decodeURIComponent(
    decodeURIComponent(
      pipe(
        url.split('/'),
        Array.last,
        Option.getOrElse(() => '')
      )
    )
  )
  const fileId = /^[0-9a-f]{24}/.exec(fileName)?.[0]
  if (fileId === undefined)
    return Effect.fail(new ExportError({message: `No file id in ${url}`}))
  const extension = /\.[a-z0-9]+$/i.exec(fileName)?.[0].toLowerCase() ?? ''
  return Effect.succeed(`content/cms/${fileId}${extension}`)
}

const makeRehoster = (): {
  rehostUrl: (url: string) => Effect.Effect<UriString, ExportError>
  rehostHtml: (html: string) => Effect.Effect<string, ExportError>
  manifest: () => string
} => {
  const sourceByKey = new Map<string, string>()
  const rehostUrl = (url: string): Effect.Effect<UriString, ExportError> =>
    Effect.gen(function* (_) {
      const key = yield* _(resourceKeyFor(url))
      const existing = sourceByKey.get(key)
      if (existing !== undefined && existing !== url)
        yield* _(Effect.logInfo(`Same file id, reusing ${key} for ${url}`))
      if (existing === undefined) sourceByKey.set(key, url)
      return Schema.decodeSync(UriString)(`${RESOURCES_BASE_URL}/${key}`)
    })
  return {
    rehostUrl,
    rehostHtml: (html) =>
      Effect.gen(function* (_) {
        const urls = Array.dedupe(html.match(WEBFLOW_FILE_URL) ?? [])
        let result = html
        for (const url of urls) {
          result = result.replaceAll(url, yield* _(rehostUrl(url)))
        }
        return result
      }),
    manifest: () =>
      pipe(
        Array.fromIterable(sourceByKey),
        Array.map(([key, source]) => `${source}\t${key}`),
        Array.join('\n')
      ) + '\n',
  }
}

/** Czech versions come from the new website (scraped from Weglot). */
const readCzechVersion = (
  websiteRef: string,
  files: readonly string[],
  slug: string,
  en: BlogPostContent
): Effect.Effect<Option.Option<BlogPostContent>, ExportError> =>
  Effect.gen(function* (_) {
    if (!Array.contains(files, `${slug}.md`)) {
      yield* _(Effect.logWarning(`${slug} is not on the website, EN only`))
      return Option.none()
    }
    const front = yield* _(
      Schema.decodeUnknown(WebsiteFrontmatter)(
        matter(git('show', `${websiteRef}:${WEBSITE_BLOG_DIR}/${slug}.md`)).data
      )
    )
    if (front.cs === undefined) return Option.none()
    if (!Array.contains(files, `${slug}.cs.md`)) return Option.some(en)

    const translation = matter(
      git('show', `${websiteRef}:${WEBSITE_BLOG_DIR}/${slug}.cs.md`)
    )
    if (translation.content.includes('/wf/'))
      return yield* _(
        new ExportError({message: `${slug}.cs.md links website-only files`})
      )
    const {title, summary} = yield* _(
      Schema.decodeUnknown(WebsiteTranslation)(translation.data)
    )
    return Option.some({
      title,
      summary: Option.some(summary),
      body: yield* _(
        Effect.promise(async () => await marked.parse(translation.content))
      ),
    })
  }).pipe(
    Effect.mapError(
      (cause) =>
        new ExportError({message: `Czech version of ${slug} failed`, cause})
    )
  )

const program = Effect.gen(function* (_) {
  const token = yield* _(Config.redacted('WEBFLOW_TOKEN'))
  const websiteRef = yield* _(
    Config.string('WEBSITE_REF').pipe(
      Config.withDefault('origin/t3/vexl-website')
    )
  )
  const {rehostUrl, rehostHtml, manifest} = makeRehoster()

  const websiteFiles = pipe(
    git(
      'ls-tree',
      '--full-tree',
      '--name-only',
      `${websiteRef}:${WEBSITE_BLOG_DIR}`
    ).split('\n'),
    Array.filter((file) => file.length > 0)
  )

  const blogItems = yield* _(
    fetchLiveItems(BLOG_COLLECTION_ID, WebflowBlogItem, token)
  )
  const blogPosts = yield* _(
    Effect.forEach(blogItems, (item) =>
      Effect.gen(function* (_) {
        const fields = item.fieldData
        const en: BlogPostContent = {
          title: fields.name,
          summary: Option.fromNullable(fields['teaser-text']),
          body: yield* _(rehostHtml(fields['rich-text'] ?? '')),
        }
        return {
          id: item.id,
          slug: fields.slug,
          status: 'published',
          featured: fields['featured-article'] ?? false,
          imageUrl: yield* _(
            Option.fromNullable(fields['main-image']?.url),
            Effect.flatMap(rehostUrl),
            Effect.option
          ),
          publishedAt: item.lastPublished,
          createdAt: item.createdOn,
          en,
          cs: yield* _(
            readCzechVersion(websiteRef, websiteFiles, fields.slug, en)
          ),
        } satisfies BlogPost
      })
    )
  )

  const speakerItems = yield* _(
    fetchLiveItems(SPEAKERS_COLLECTION_ID, WebflowSpeakerItem, token)
  )
  const speakers = new Map<string, Speaker>()
  for (const item of speakerItems) {
    const imageUrl = item.fieldData['event-speaker-image']?.url
    speakers.set(item.id, {
      name: item.fieldData.name,
      linkToSocials: Option.fromNullable(item.fieldData['link-to-socials']),
      imageUrl:
        imageUrl === undefined
          ? Option.none()
          : Option.some(yield* _(rehostUrl(imageUrl))),
    })
  }

  const eventItems = yield* _(
    fetchLiveItems(EVENTS_COLLECTION_ID, WebflowEventItem, token)
  )
  const events = yield* _(
    Effect.forEach(eventItems, (item) =>
      Effect.gen(function* (_) {
        const fields = item.fieldData
        return {
          id: item.id,
          status: 'published',
          name: fields.name,
          venue: fields.venue,
          link: fields['event-link'],
          startDate: fields['start-date-time'],
          endDate: Option.fromNullable(fields['end-date-time']),
          goldenGlasses: fields['golden-glasses'] ?? false,
          speakers: yield* _(
            Effect.forEach(fields['event-speakers'] ?? [], (id) =>
              Option.match(Option.fromNullable(speakers.get(id)), {
                onNone: () =>
                  Effect.fail(
                    new ExportError({message: `Unpublished speaker ${id}`})
                  ),
                onSome: Effect.succeed,
              })
            )
          ),
        } satisfies CmsEvent
      })
    )
  )

  const snapshot = yield* _(Schema.encode(CmsSnapshot)({blogPosts, events}))
  writeFileSync(
    join(import.meta.dirname, 'webflowSnapshot.json'),
    `${JSON.stringify(snapshot, null, 2)}\n`
  )
  writeFileSync(join(import.meta.dirname, 'cmsImages.tsv'), manifest())
  yield* _(
    Effect.logInfo(
      `Exported ${blogPosts.length} posts, ${events.length} events, ${speakerItems.length} speakers`
    )
  )
})

NodeRuntime.runMain(program)
