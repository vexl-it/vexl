import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type Event,
  EventId,
  type EventsResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
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

export const getEventsHandler = makeHttpApiHandler(
  ContentApiSpecification,
  'Cms',
  'getEvents',
  () =>
    Effect.gen(function* () {
      const cache = yield* CacheService

      const data = yield* cache.getEventsFromRedis
      if (Option.isSome(data)) {
        yield* Effect.logInfo(
          'Got events cached in redis, not fetching from webflow'
        )
        return data.value
      }

      yield* Effect.logInfo('No events in redis, fetching from webflow')

      const webflowService = yield* WebflowCmsService
      const events = yield* webflowService.fetchEvents()
      const speakers = yield* webflowService.fetchSpeakers()

      const response = {
        events: webflowEventsToResponse({
          speakers: speakers.items,
          events: events.items,
        }),
      } satisfies EventsResponse

      yield* cache.saveEventsToCacheForked(response)

      return response
    }).pipe(
      Effect.catch(
        (e) =>
          new UnexpectedServerError({
            cause: e,
            status: 500,
          })
      ),
      Effect.withSpan('getEvents'),
      makeEndpointEffect
    )
)
