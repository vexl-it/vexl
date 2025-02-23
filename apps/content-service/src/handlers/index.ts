import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {hashSha256} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  ClearEventsCacheErrors,
  type Event,
  EventId,
  EventsResponse,
  InvalidTokenError,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {
  ClearEventsCacheEndpoint,
  GetEventsEndpoint,
} from '@vexl-next/rest-api/src/services/content/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Effect, Option, Schema} from 'effect'
import {Handler} from 'effect-http'
import {ClearCacheTokenHashConfig} from '../configs'
import {WebflowCmsService} from '../utils/webflowCms'
import {
  type WebflowEventItem,
  type WebflowSpeakerItem,
} from '../utils/webflowCms/domain'

const EVENTS_REDIS_KEY = 'CONTENT:events'
const EVENTS_REDIS_LIVETIME_MILISEC = 1000 * 60 * 60 * 24
const getEventsFromRedis = RedisService.pipe(
  Effect.flatMap((redis) => redis.get(EventsResponse)(EVENTS_REDIS_KEY)),
  Effect.option
)

const saveEventsToRedisForked = (
  toSave: EventsResponse
): Effect.Effect<void, never, RedisService> =>
  RedisService.pipe(
    Effect.flatMap((redis) =>
      redis.set(EventsResponse)(EVENTS_REDIS_KEY, toSave, {
        expiresAt: unixMillisecondsFromNow(EVENTS_REDIS_LIVETIME_MILISEC),
      })
    ),
    Effect.withSpan('saveEventsToRedis', {attributes: {events: toSave}}),
    Effect.forkDaemon,
    Effect.ignore
  )

const clearRedisCache = RedisService.pipe(
  Effect.flatMap((e) => e.delete(EVENTS_REDIS_KEY))
)

const webflowEventsToResponse = ({
  speakers,
  events,
}: {
  speakers: readonly WebflowSpeakerItem[]
  events: readonly WebflowEventItem[]
}): readonly Event[] => {
  const speakerIdToSpeaker: Record<string, WebflowSpeakerItem> =
    speakers.reduce<Record<string, WebflowSpeakerItem>>((acc, speaker) => {
      acc[speaker.id] = speaker
      return acc
    }, {})

  return events.map(
    (event) =>
      ({
        id: Schema.decodeSync(EventId)(event.id),
        startDate: event.fieldData['start-date-time'],
        endDate: event.fieldData['end-date-time'],
        link: event.fieldData['event-link'],
        name: event.fieldData.name,
        venue: event.fieldData.venue,
        speakers: event.fieldData['event-speakers']
          .map((id) => speakerIdToSpeaker[id])
          .map((one) => ({
            name: one.fieldData.name,
            linkToSocials: one.fieldData['link-to-socials'],
            imageUrl: Option.map(
              one.fieldData['event-speaker-image'],
              (one) => one.url
            ),
          })),
        goldenGlasses: event.fieldData['golden-glasses'],
      }) satisfies Event
  )
}

export const getEventsHandler = Handler.make(GetEventsEndpoint, () =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const data = yield* _(getEventsFromRedis)
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
      const events = yield* _(webflowService.fetchEvents())
      const speakers = yield* _(webflowService.fetchSpeakers())

      return {
        events: webflowEventsToResponse({
          speakers: speakers.items,
          events: events.items,
        }),
      } satisfies EventsResponse
    }).pipe(
      Effect.catchAll(
        (e) =>
          new UnexpectedServerError({
            cause: e,
            status: 500,
          })
      ),
      Effect.tap(saveEventsToRedisForked),
      Effect.withSpan('getEvents')
    ),
    Schema.Void
  )
)

export const clearEventsCacheHandler = Handler.make(
  ClearEventsCacheEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const token = req.query.token

        const receivedTokenHash = yield* _(hashSha256(token))

        if (receivedTokenHash !== (yield* _(ClearCacheTokenHashConfig))) {
          return yield* _(new InvalidTokenError({status: 401}))
        }

        yield* _(clearRedisCache)

        return null
      }).pipe(
        Effect.catchTags({
          'ConfigError': (e) =>
            new UnexpectedServerError({cause: e, status: 500}),
          'CryptoError': (e) =>
            new UnexpectedServerError({cause: e, status: 500}),
          'RedisError': (e) =>
            new UnexpectedServerError({cause: e, status: 500}),
        }),
        Effect.withSpan('clearEventsCache')
      ),
      ClearEventsCacheErrors
    )
)
