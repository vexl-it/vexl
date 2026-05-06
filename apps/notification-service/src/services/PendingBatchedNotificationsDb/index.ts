import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type VexlProductNotification} from '@vexl-next/domain/src/general/vexlProductNotification'
import {
  type UserNotificationMqEntry,
  VexlProductNotificationMqEntry,
} from '@vexl-next/server-utils/src/UserNotificationMq'
import {Array, Context, Effect, Layer, pipe} from 'effect'
import {
  PendingBatchedNotificationDbRecord,
  PendingBatchedNotificationRecordId,
  RawPendingBatchedNotificationDbRecord,
} from './domain'
import {
  createDeletePendingRows,
  createFindOldestPendingRows,
  createInsertPendingEntries,
} from './queries'

export {
  PendingBatchedNotificationDbRecord,
  PendingBatchedNotificationRecordId,
  RawPendingBatchedNotificationDbRecord,
}

export interface PendingBatchedNotificationsDbOperations {
  insertPendingEntries: (
    entries: ReadonlyArray<typeof UserNotificationMqEntry.Type>
  ) => Effect.Effect<void, UnexpectedServerError>
  insertPendingForVexlProductNotification: (
    vexlProductNotification: VexlProductNotification,
    tokens: readonly VexlNotificationToken[]
  ) => Effect.Effect<void, UnexpectedServerError>
  findOldestPendingRows: (
    batchSize: number
  ) => Effect.Effect<
    readonly RawPendingBatchedNotificationDbRecord[],
    UnexpectedServerError
  >
  deletePendingRows: (
    ids: readonly PendingBatchedNotificationRecordId[]
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class PendingBatchedNotificationsDb extends Context.Tag(
  'PendingBatchedNotificationsDb'
)<PendingBatchedNotificationsDb, PendingBatchedNotificationsDbOperations>() {
  static readonly Live = Layer.effect(
    PendingBatchedNotificationsDb,
    Effect.gen(function* () {
      const insertPendingEntries = yield* createInsertPendingEntries
      const findOldestPendingRows = yield* createFindOldestPendingRows
      const deletePendingRows = yield* createDeletePendingRows

      const insertPendingForVexlProductNotification = (
        vexlProductNotification: VexlProductNotification,
        tokens: readonly VexlNotificationToken[]
      ): Effect.Effect<void, UnexpectedServerError> =>
        pipe(
          tokens,
          Array.map(
            (token) =>
              new VexlProductNotificationMqEntry({
                token,
                notificationToken: null,
                vexlProductNotification,
              })
          ),
          insertPendingEntries
        )

      return {
        insertPendingEntries,
        insertPendingForVexlProductNotification,
        findOldestPendingRows,
        deletePendingRows,
      }
    })
  )
}
