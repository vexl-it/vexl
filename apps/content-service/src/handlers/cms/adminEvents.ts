import {HttpApiBuilder} from '@effect/platform/index'
import {
  EventId,
  type CmsEvent,
  type CmsStatus,
} from '@vexl-next/domain/src/general/cms'
import {
  type NotFoundError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {type InvalidContentAdminTokenError} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentInternalApiSpecification} from '@vexl-next/rest-api/src/services/content/internalSpecification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Schema} from 'effect'
import {EventsDbService} from '../../db/EventsDbService'
import {validateCmsToken} from '../validateAdminToken'
import {orNotFound} from './orNotFound'

export const listEventsHandler = HttpApiBuilder.handler(
  ContentInternalApiSpecification,
  'Cms',
  'listEvents',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateCmsToken(req.headers[HEADER_ADMIN_TOKEN]))
      const events = yield* _(
        EventsDbService,
        Effect.flatMap((db) => db.listAllEvents)
      )
      return {events}
    }).pipe(Effect.withSpan('listEvents'), makeEndpointEffect)
)

export const createEventHandler = HttpApiBuilder.handler(
  ContentInternalApiSpecification,
  'Cms',
  'createEvent',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateCmsToken(req.headers[HEADER_ADMIN_TOKEN]))
      const event: CmsEvent = {
        ...req.payload,
        id: Schema.decodeSync(EventId)(generateUuid()),
        status: 'draft',
      }
      yield* _(
        EventsDbService,
        Effect.flatMap((db) => db.insertEvent(event))
      )
      return event
    }).pipe(Effect.withSpan('createEvent'), makeEndpointEffect)
)

export const updateEventHandler = HttpApiBuilder.handler(
  ContentInternalApiSpecification,
  'Cms',
  'updateEvent',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateCmsToken(req.headers[HEADER_ADMIN_TOKEN]))
      return yield* _(
        EventsDbService,
        Effect.flatMap((db) =>
          db.updateEvent({id: req.path.id, input: req.payload})
        ),
        orNotFound
      )
    }).pipe(Effect.withSpan('updateEvent'), makeEndpointEffect)
)

const setEventStatus = (
  adminToken: string,
  id: EventId,
  status: CmsStatus
): Effect.Effect<
  CmsEvent,
  InvalidContentAdminTokenError | UnexpectedServerError | NotFoundError,
  EventsDbService
> =>
  Effect.gen(function* (_) {
    yield* _(validateCmsToken(adminToken))
    return yield* _(
      EventsDbService,
      Effect.flatMap((db) => db.setEventStatus({id, status})),
      orNotFound
    )
  }).pipe(Effect.withSpan('setEventStatus'), makeEndpointEffect)

export const publishEventHandler = HttpApiBuilder.handler(
  ContentInternalApiSpecification,
  'Cms',
  'publishEvent',
  (req) =>
    setEventStatus(req.headers[HEADER_ADMIN_TOKEN], req.path.id, 'published')
)

export const unpublishEventHandler = HttpApiBuilder.handler(
  ContentInternalApiSpecification,
  'Cms',
  'unpublishEvent',
  (req) => setEventStatus(req.headers[HEADER_ADMIN_TOKEN], req.path.id, 'draft')
)

export const deleteEventHandler = HttpApiBuilder.handler(
  ContentInternalApiSpecification,
  'Cms',
  'deleteEvent',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateCmsToken(req.headers[HEADER_ADMIN_TOKEN]))
      yield* _(
        EventsDbService,
        Effect.flatMap((db) => db.deleteEvent(req.path.id)),
        orNotFound
      )
      return {}
    }).pipe(Effect.withSpan('deleteEvent'), makeEndpointEffect)
)
