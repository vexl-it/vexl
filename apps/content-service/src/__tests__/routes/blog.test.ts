import {BlogSlug, type BlogPostInput} from '@vexl-next/domain/src/general/cms'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  BlogSlugTakenError,
  InvalidContentAdminTokenError,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Array, Effect, Option, Schema} from 'effect'
import {NodeTestingApp, NodeTestingInternalApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const headers = {'x-admin-token': 'dev'}

const makeInput = (slug: string): BlogPostInput => ({
  slug: Schema.decodeSync(BlogSlug)(slug),
  featured: false,
  imageUrl: Option.some(
    Schema.decodeSync(UriString)('https://resources.vexl.it/content/a.png')
  ),
  publishedAt: new Date('2026-11-01T10:00:00.000Z'),
  en: {title: 'Title', summary: Option.some('Summary'), body: '<p>Body</p>'},
  cs: {title: 'Titulek', summary: Option.none(), body: '<p>Text</p>'},
})

const publicSlugs = Effect.gen(function* (_) {
  const app = yield* _(NodeTestingApp)
  const {blogPosts} = yield* _(app.Cms.getPublishedBlogPosts({}))
  const {articles} = yield* _(app.Cms.getBlogArticles({}))
  expect(Array.map(articles, (one) => one.slug)).toEqual(
    Array.map(blogPosts, (one) => one.slug)
  )
  return Array.map(blogPosts, (one) => one.slug)
})

describe('blog posts', () => {
  it('serves the mobile blog list in the existing contract', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const {articles} = yield* _(app.Cms.getBlogArticles({}))
        const article = Array.findFirst(
          articles,
          (one) => one.slug === 'so-what-is-vexl-anyway'
        )

        expect(article).toEqual(
          Option.some({
            id: '66cf2c02c759d4f4c55f3f27',
            slug: 'so-what-is-vexl-anyway',
            title: 'So what is Vexl anyway?',
            link: 'https://vexl.it/post/so-what-is-vexl-anyway',
            publishedOn: new Date('2024-09-11T12:20:34.428Z'),
            teaserText: expect.anything(),
            mainImage: Option.some(
              'https://resources.vexl.it/content/cms/66cf1f68e3db4ee9a8a5d63c.png'
            ),
          })
        )
      })
    )
  })

  it('creates drafts and serves them only once published', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalApp = yield* _(NodeTestingInternalApp)
        const created = yield* _(
          internalApp.Cms.createBlogPost({
            headers,
            payload: makeInput('lifecycle'),
          })
        )
        expect(created.status).toEqual('draft')
        expect(yield* _(publicSlugs)).not.toContain('lifecycle')

        yield* _(
          internalApp.Cms.publishBlogPost({headers, path: {id: created.id}})
        )
        expect(yield* _(publicSlugs)).toContain('lifecycle')

        const updated = yield* _(
          internalApp.Cms.updateBlogPost({
            headers,
            path: {id: created.id},
            payload: {...makeInput('lifecycle-renamed'), featured: true},
          })
        )
        expect(updated).toEqual({
          ...created,
          ...makeInput('lifecycle-renamed'),
          featured: true,
          status: 'published',
          cs: Option.some(makeInput('lifecycle').cs),
          createdAt: expect.any(Date),
        })
        expect(yield* _(publicSlugs)).toContain('lifecycle-renamed')

        yield* _(
          internalApp.Cms.unpublishBlogPost({headers, path: {id: created.id}})
        )
        expect(yield* _(publicSlugs)).not.toContain('lifecycle-renamed')

        yield* _(
          internalApp.Cms.deleteBlogPost({headers, path: {id: created.id}})
        )
        expectErrorResponse(NotFoundError)(
          yield* _(
            internalApp.Cms.publishBlogPost({headers, path: {id: created.id}}),
            Effect.either
          )
        )
      })
    )
  })

  it('lists drafts and published posts for editors', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalApp = yield* _(NodeTestingInternalApp)
        const draft = yield* _(
          internalApp.Cms.createBlogPost({
            headers,
            payload: makeInput('listed-draft'),
          })
        )
        const {blogPosts} = yield* _(internalApp.Cms.listBlogPosts({headers}))

        expect(
          Array.findFirst(blogPosts, (one) => one.id === draft.id)
        ).toEqual(Option.some({...draft, createdAt: expect.any(Date)}))
        expect(
          Array.findFirst(
            blogPosts,
            (one) => one.slug === 'so-what-is-vexl-anyway'
          ).pipe(Option.map((one) => one.status))
        ).toEqual(Option.some('published'))
      })
    )
  })

  it('rejects a taken slug', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalApp = yield* _(NodeTestingInternalApp)
        expectErrorResponse(BlogSlugTakenError)(
          yield* _(
            internalApp.Cms.createBlogPost({
              headers,
              payload: makeInput('so-what-is-vexl-anyway'),
            }),
            Effect.either
          )
        )
      })
    )
  })

  it('rejects a wrong admin token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalApp = yield* _(NodeTestingInternalApp)
        expectErrorResponse(InvalidContentAdminTokenError)(
          yield* _(
            internalApp.Cms.createBlogPost({
              headers: {'x-admin-token': 'wrong'},
              payload: makeInput('unauthorized'),
            }),
            Effect.either
          )
        )
      })
    )
  })
})
