import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlProductNotification} from '@vexl-next/domain/src/general/vexlProductNotification'
import {DuplicateVexlProductNotificationUuidError} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, flow, Schema} from 'effect'
import {isUniqueViolation} from '../../isUniqueViolation'
import {
  VexlProductNotificationDbRecord,
  vexlProductNotificationFromDbRecord,
} from '../domain'

export const InsertVexlProductNotificationParams = Schema.Struct({
  vexlProductNotification: VexlProductNotification,
})
export type InsertVexlProductNotificationParams =
  typeof InsertVexlProductNotificationParams.Type

export const createInsertVexlProductNotification = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
    Request: InsertVexlProductNotificationParams,
    Result: VexlProductNotificationDbRecord,
    execute: (params) => sql`
      INSERT INTO
        vexl_product_notifications (
          UUID,
          title,
          description,
          issue_push_notification,
          date,
          action_link,
          action_text,
          type
        )
      VALUES
        (
          ${params.vexlProductNotification.uuid},
          ${params.vexlProductNotification.title},
          ${params.vexlProductNotification.description},
          ${params.vexlProductNotification.issuePushNotification},
          ${params.vexlProductNotification.date},
          ${params.vexlProductNotification.actionLink ?? null},
          ${params.vexlProductNotification.actionText ?? null},
          ${params.vexlProductNotification.type}
        )
      RETURNING
        id,
        UUID,
        title,
        description,
        issue_push_notification,
        date,
        action_link,
        action_text,
        type
    `,
  })

  return flow(
    query,
    Effect.map(vexlProductNotificationFromDbRecord),
    Effect.catchAll(
      (
        e
      ): Effect.Effect<
        never,
        DuplicateVexlProductNotificationUuidError | UnexpectedServerError
      > => {
        if (
          e._tag === 'SqlError' &&
          isUniqueViolation(e, 'vexl_product_notifications_uuid_key')
        ) {
          return Effect.fail(new DuplicateVexlProductNotificationUuidError())
        }

        return Effect.fail(new UnexpectedServerError({status: 500, cause: e}))
      }
    ),
    Effect.withSpan('insertVexlProductNotification query')
  )
})
