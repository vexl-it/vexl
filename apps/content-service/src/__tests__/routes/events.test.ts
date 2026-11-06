import {type EventInput} from '@vexl-next/domain/src/general/cms'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Array, Effect, Option} from 'effect'
import {NodeTestingApp, NodeTestingInternalApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const headers = {'x-admin-token': 'dev'}

const input: EventInput = {
  name: 'Vexl meetup',
  venue: 'Prague',
  link: 'https://vexl.it',
  startDate: new Date('2026-12-01T18:00:00.000Z'),
  endDate: Option.none(),
  goldenGlasses: true,
  speakers: [
    {
      name: 'Satoshi',
      linkToSocials: Option.some('https://x.com/vexl'),
      imageUrl: Option.none(),
    },
  ],
}

const publicEventNames = Effect.gen(function* (_) {
  const app = yield* _(NodeTestingApp)
  const {events} = yield* _(app.Cms.getPublishedEvents({}))
  const mobile = yield* _(app.Cms.getEvents({}))
  expect(mobile.events).toEqual(
    Array.map(events, ({status, ...event}) => event)
  )
  return Array.map(events, (one) => one.name)
})

describe('events', () => {
  it('serves the mobile events in the existing contract', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const {events} = yield* _(app.Cms.getEvents({}))
        const event = Array.findFirst(
          events,
          (one) => one.name === 'Watch Out Bitcoin!'
        )

        expect(event).toEqual(
          Option.some({
            id: '6aabfec2d6eeb85c6ac94932',
            name: 'Watch Out Bitcoin!',
            venue: 'Espacio Pablo VI, Madrid, Spain 🇪🇸',
            link: 'https://wobitcoin.org',
            startDate: new Date('2026-10-02T07:00:00.000Z'),
            endDate: Option.some(new Date('2026-10-04T18:00:00.000Z')),
            goldenGlasses: false,
            speakers: [
              {
                name: 'Zenx',
                linkToSocials: Option.none(),
                imageUrl: Option.none(),
              },
              {
                name: 'Natalia',
                linkToSocials: Option.none(),
                imageUrl: Option.none(),
              },
            ],
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
          internalApp.Cms.createEvent({headers, payload: input})
        )
        expect(created).toEqual({...input, id: created.id, status: 'draft'})
        expect(yield* _(publicEventNames)).not.toContain('Vexl meetup')

        yield* _(
          internalApp.Cms.publishEvent({headers, path: {id: created.id}})
        )
        expect(yield* _(publicEventNames)).toContain('Vexl meetup')

        const updated = yield* _(
          internalApp.Cms.updateEvent({
            headers,
            path: {id: created.id},
            payload: {...input, name: 'Renamed meetup', speakers: []},
          })
        )
        expect(updated).toEqual({
          ...input,
          id: created.id,
          status: 'published',
          name: 'Renamed meetup',
          speakers: [],
        })

        yield* _(
          internalApp.Cms.unpublishEvent({headers, path: {id: created.id}})
        )
        expect(yield* _(publicEventNames)).not.toContain('Renamed meetup')

        yield* _(internalApp.Cms.deleteEvent({headers, path: {id: created.id}}))
        expectErrorResponse(NotFoundError)(
          yield* _(
            internalApp.Cms.updateEvent({
              headers,
              path: {id: created.id},
              payload: input,
            }),
            Effect.either
          )
        )
      })
    )
  })
})
