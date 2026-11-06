import {BlogSlug, type EventInput} from '@vexl-next/domain/src/general/cms'
import {VexlProductNotificationUuid} from '@vexl-next/domain/src/general/vexlProductNotification'
import {InvalidContentAdminTokenError} from '@vexl-next/rest-api/src/services/content/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Option, Schema} from 'effect'
import {NodeTestingInternalApp} from '../utils/NodeTestingApp'
import {
  enqueuedVexlProductNotifications,
  runPromiseInMockedEnvironment,
} from '../utils/runPromiseInMockedEnvironment'

const editorHeaders = {'x-admin-token': 'editor'}

const event: EventInput = {
  name: 'Editor meetup',
  venue: 'Brno',
  link: 'https://vexl.it',
  startDate: new Date('2026-12-10T18:00:00.000Z'),
  endDate: Option.none(),
  goldenGlasses: false,
  speakers: [],
}

describe('Content editor token', () => {
  it('manages blog posts', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalApp = yield* _(NodeTestingInternalApp)
        const created = yield* _(
          internalApp.Cms.createBlogPost({
            headers: editorHeaders,
            payload: {
              slug: Schema.decodeSync(BlogSlug)('editor-post'),
              featured: false,
              imageUrl: Option.none(),
              publishedAt: new Date('2026-11-01T10:00:00.000Z'),
              en: {title: 'Title', summary: Option.none(), body: '<p>EN</p>'},
              cs: {title: 'Titulek', summary: Option.none(), body: '<p>CS</p>'},
            },
          })
        )
        const path = {id: created.id}

        yield* _(internalApp.Cms.listBlogPosts({headers: editorHeaders}))
        yield* _(
          internalApp.Cms.updateBlogPost({
            headers: editorHeaders,
            path,
            payload: {...created, cs: Option.getOrThrow(created.cs)},
          })
        )
        yield* _(
          internalApp.Cms.publishBlogPost({headers: editorHeaders, path})
        )
        yield* _(
          internalApp.Cms.unpublishBlogPost({headers: editorHeaders, path})
        )
        yield* _(internalApp.Cms.deleteBlogPost({headers: editorHeaders, path}))
      })
    )
  })

  it('manages events', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalApp = yield* _(NodeTestingInternalApp)
        const created = yield* _(
          internalApp.Cms.createEvent({headers: editorHeaders, payload: event})
        )
        const path = {id: created.id}

        yield* _(internalApp.Cms.listEvents({headers: editorHeaders}))
        yield* _(
          internalApp.Cms.updateEvent({
            headers: editorHeaders,
            path,
            payload: event,
          })
        )
        yield* _(internalApp.Cms.publishEvent({headers: editorHeaders, path}))
        yield* _(internalApp.Cms.unpublishEvent({headers: editorHeaders, path}))
        yield* _(internalApp.Cms.deleteEvent({headers: editorHeaders, path}))
      })
    )
  })

  it('cannot send product notifications', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalApp = yield* _(NodeTestingInternalApp)
        const result = yield* _(
          internalApp.VexlProductNotifications.createVexlProductNotification({
            headers: editorHeaders,
            payload: {
              issuePushNotification: true,
              vexlProductNotification: {
                uuid: Schema.decodeSync(VexlProductNotificationUuid)(
                  'c5f0a0de-35a4-4c39-9d1b-5d0f3f1e2a10'
                ),
                title: 'Not allowed',
                description: 'Editors cannot push to every user',
                issuePushNotification: true,
                date: new Date('2026-11-01T10:00:00.000Z'),
                type: 'GENERAL',
              },
            },
          }),
          Effect.either
        )

        expectErrorResponse(InvalidContentAdminTokenError)(result)
        expect(enqueuedVexlProductNotifications).toEqual([])
      })
    )
  })

  it('rejects an unknown token on the admin lists', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalApp = yield* _(NodeTestingInternalApp)
        const headers = {'x-admin-token': 'wrong'}

        expectErrorResponse(InvalidContentAdminTokenError)(
          yield* _(internalApp.Cms.listBlogPosts({headers}), Effect.either)
        )
        expectErrorResponse(InvalidContentAdminTokenError)(
          yield* _(internalApp.Cms.listEvents({headers}), Effect.either)
        )
      })
    )
  })
})
