import {HttpApiBuilder} from '@effect/platform/index'
import {type CmsEvent} from '@vexl-next/domain/src/general/cms'
import {type Event} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect} from 'effect'
import {EventsDbService} from '../db/EventsDbService'

const toMobileEvent = ({status, ...event}: CmsEvent): Event => event

const listPublishedEvents = EventsDbService.pipe(
  Effect.flatMap((db) => db.listPublishedEvents)
)

export const getEventsHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Cms',
  'getEvents',
  () =>
    listPublishedEvents.pipe(
      Effect.map((events) => ({events: Array.map(events, toMobileEvent)})),
      Effect.withSpan('getEvents'),
      makeEndpointEffect
    )
)

export const getPublishedEventsHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Cms',
  'getPublishedEvents',
  () =>
    listPublishedEvents.pipe(
      Effect.map((events) => ({events})),
      Effect.withSpan('getPublishedEvents'),
      makeEndpointEffect
    )
)
