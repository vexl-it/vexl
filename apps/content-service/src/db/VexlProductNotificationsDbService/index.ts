import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type VexlProductNotification} from '@vexl-next/domain/src/general/vexlProductNotification'
import {type DuplicateVexlProductNotificationUuidError} from '@vexl-next/rest-api/src/services/content/contracts'
import {Context, Effect, Layer} from 'effect'
import {
  createInsertVexlProductNotification,
  type InsertVexlProductNotificationParams,
} from './queries/createInsertVexlProductNotification'
import {
  createQueryVexlProductNotifications,
  type QueryVexlProductNotificationsParams,
} from './queries/createQueryVexlProductNotifications'

export interface VexlProductNotificationsDbOperations {
  insertVexlProductNotification: (
    params: InsertVexlProductNotificationParams
  ) => Effect.Effect<
    VexlProductNotification,
    DuplicateVexlProductNotificationUuidError | UnexpectedServerError
  >
  queryVexlProductNotifications: (
    params: QueryVexlProductNotificationsParams
  ) => Effect.Effect<readonly VexlProductNotification[], UnexpectedServerError>
}

export class VexlProductNotificationsDbService extends Context.Tag(
  'VexlProductNotificationsDbService'
)<VexlProductNotificationsDbService, VexlProductNotificationsDbOperations>() {
  static readonly Live = Layer.effect(
    VexlProductNotificationsDbService,
    Effect.gen(function* (_) {
      const insertVexlProductNotification = yield* _(
        createInsertVexlProductNotification
      )
      const queryVexlProductNotifications = yield* _(
        createQueryVexlProductNotifications
      )

      return {
        insertVexlProductNotification,
        queryVexlProductNotifications,
      }
    })
  )
}
