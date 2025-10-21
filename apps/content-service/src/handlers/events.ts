import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type Event,
  EventId,
  type EventsResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option, Schema} from 'effect'
import {CacheService} from '../utils/cache'
import {WebflowCmsService} from '../utils/webflowCms'
import {
  type WebflowEventItem,
  type WebflowSpeakerItem,
} from '../utils/webflowCms/domain'

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

export const getEventsHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Cms',
  'getEvents',
  () =>
    Effect.gen(function* (_) {
      const cache = yield* _(CacheService)

      const data = yield* _(cache.getEventsFromRedis)
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
      Effect.tap((data) =>
        CacheService.pipe(
          Effect.flatMap((cache) => cache.saveEventsToCacheForked(data))
        )
      ),
      Effect.withSpan('getEvents'),
      makeEndpointEffect
    )
)
