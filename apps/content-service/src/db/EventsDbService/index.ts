import {SqlClient, SqlSchema} from '@effect/sql'
import {
  CmsStatus,
  EventId,
  type CmsEvent,
  type EventInput,
} from '@vexl-next/domain/src/general/cms'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Context, Effect, flow, Layer, Option, Schema} from 'effect'
import {eventContentColumns, EventDbRecord, eventFromDbRecord} from './domain'

export interface EventsDbOperations {
  insertEvent: (event: CmsEvent) => Effect.Effect<void, UnexpectedServerError>
  updateEvent: (params: {
    id: EventId
    input: EventInput
  }) => Effect.Effect<Option.Option<CmsEvent>, UnexpectedServerError>
  setEventStatus: (params: {
    id: EventId
    status: CmsStatus
  }) => Effect.Effect<Option.Option<CmsEvent>, UnexpectedServerError>
  deleteEvent: (
    id: EventId
  ) => Effect.Effect<Option.Option<unknown>, UnexpectedServerError>
  listPublishedEvents: Effect.Effect<readonly CmsEvent[], UnexpectedServerError>
  listAllEvents: Effect.Effect<readonly CmsEvent[], UnexpectedServerError>
}

export class EventsDbService extends Context.Tag('EventsDbService')<
  EventsDbService,
  EventsDbOperations
>() {
  static readonly Live = Layer.effect(
    EventsDbService,
    Effect.gen(function* (_) {
      const sql = yield* _(SqlClient.SqlClient)

      const setEventStatus = SqlSchema.findOne({
        Request: Schema.Struct({id: EventId, status: CmsStatus}),
        Result: EventDbRecord,
        execute: ({id, status}) => sql`
          UPDATE events
          SET
            status = ${status},
            updated_at = now()
          WHERE
            id = ${id}
          RETURNING
            *
        `,
      })

      const deleteEvent = SqlSchema.findOne({
        Request: EventId,
        Result: Schema.Struct({id: EventId}),
        execute: (id) => sql`
          DELETE FROM events
          WHERE
            id = ${id}
          RETURNING
            id
        `,
      })

      const listPublishedEvents = SqlSchema.findAll({
        Request: Schema.Void,
        Result: EventDbRecord,
        execute: () => sql`
          SELECT
            *
          FROM
            events
          WHERE
            status = 'published'
          ORDER BY
            start_date DESC
        `,
      })

      const listAllEvents = SqlSchema.findAll({
        Request: Schema.Void,
        Result: EventDbRecord,
        execute: () => sql`
          SELECT
            *
          FROM
            events
          ORDER BY
            start_date DESC
        `,
      })

      return {
        insertEvent: (event) => {
          const columns = eventContentColumns(event)
          return sql`
            INSERT INTO
              events (
                id,
                status,
                name,
                venue,
                link,
                start_date,
                end_date,
                golden_glasses,
                speakers
              )
            VALUES
              (
                ${event.id},
                ${event.status},
                ${columns.name},
                ${columns.venue},
                ${columns.link},
                ${columns.startDate},
                ${columns.endDate},
                ${columns.goldenGlasses},
                ${columns.speakersJson}::jsonb
              )
          `.pipe(
            UnexpectedServerError.wrapErrors('Error in insertEvent query'),
            Effect.withSpan('insertEvent query')
          )
        },
        updateEvent: ({id, input}) => {
          const columns = eventContentColumns(input)
          return sql`
            UPDATE events
            SET
              name = ${columns.name},
              venue = ${columns.venue},
              link = ${columns.link},
              start_date = ${columns.startDate},
              end_date = ${columns.endDate},
              golden_glasses = ${columns.goldenGlasses},
              speakers = ${columns.speakersJson}::jsonb,
              updated_at = now()
            WHERE
              id = ${id}
            RETURNING
              *
          `.pipe(
            Effect.flatMap(Schema.decodeUnknown(Schema.Array(EventDbRecord))),
            Effect.map(flow(Array.head, Option.map(eventFromDbRecord))),
            UnexpectedServerError.wrapErrors('Error in updateEvent query'),
            Effect.withSpan('updateEvent query')
          )
        },
        setEventStatus: flow(
          setEventStatus,
          Effect.map(Option.map(eventFromDbRecord)),
          UnexpectedServerError.wrapErrors('Error in setEventStatus query'),
          Effect.withSpan('setEventStatus query')
        ),
        deleteEvent: flow(
          deleteEvent,
          UnexpectedServerError.wrapErrors('Error in deleteEvent query'),
          Effect.withSpan('deleteEvent query')
        ),
        listPublishedEvents: listPublishedEvents().pipe(
          Effect.map(Array.map(eventFromDbRecord)),
          UnexpectedServerError.wrapErrors(
            'Error in listPublishedEvents query'
          ),
          Effect.withSpan('listPublishedEvents query')
        ),
        listAllEvents: listAllEvents().pipe(
          Effect.map(Array.map(eventFromDbRecord)),
          UnexpectedServerError.wrapErrors('Error in listAllEvents query'),
          Effect.withSpan('listAllEvents query')
        ),
      }
    })
  )
}
