import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type VexlNotificationToken,
  type VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Context, Effect, Layer, type Option} from 'effect'
import {
  type NotificationSecretRecord,
  type NotificationTokenRecord,
} from './domain'
import {
  createDeleteNotificationSecret,
  createDeleteNotificationToken,
  createFindAllTokensForSecret,
  createFindSecretByNotificationToken,
  createFindSecretBySecretValue,
  type CreateNotificationTokenParams,
  createSaveNotificationToken,
  createSaveNotificationTokenSecret,
  createUpdateClientInfo,
  type SaveNotificationTokenParams,
  type UpdateClientInfoParams,
} from './queries'

export interface NotificationTokensDbOperations {
  saveNotificationTokenSecret: (
    params: CreateNotificationTokenParams
  ) => Effect.Effect<NotificationSecretRecord, UnexpectedServerError>

  saveNotificationToken: (
    params: SaveNotificationTokenParams
  ) => Effect.Effect<NotificationTokenRecord, UnexpectedServerError>

  updateClientInfo: (
    params: UpdateClientInfoParams
  ) => Effect.Effect<NotificationSecretRecord, UnexpectedServerError>

  findSecretByNotificationToken: (
    Notification: VexlNotificationToken
  ) => Effect.Effect<
    Option.Option<NotificationSecretRecord>,
    UnexpectedServerError
  >

  findAllTokensForSecret: (
    secret: VexlNotificationTokenSecret
  ) => Effect.Effect<readonly NotificationTokenRecord[], UnexpectedServerError>

  findSecretBySecretValue: (
    secret: VexlNotificationTokenSecret
  ) => Effect.Effect<
    Option.Option<NotificationSecretRecord>,
    UnexpectedServerError
  >

  deleteNotificationToken: (
    token: VexlNotificationToken
  ) => Effect.Effect<void, UnexpectedServerError>

  deleteNotificationSecret: (
    secret: VexlNotificationTokenSecret
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class NotificationTokensDb extends Context.Tag('NotificationTokensDb')<
  NotificationTokensDb,
  NotificationTokensDbOperations
>() {
  static readonly Live = Layer.effect(
    NotificationTokensDb,
    Effect.gen(function* () {
      const saveNotificationTokenSecret =
        yield* createSaveNotificationTokenSecret
      const saveNotificationToken = yield* createSaveNotificationToken
      const updateClientInfo = yield* createUpdateClientInfo
      const findSecretByNotificationToken =
        yield* createFindSecretByNotificationToken
      const findAllTokensForSecret = yield* createFindAllTokensForSecret
      const findSecretBySecretValue = yield* createFindSecretBySecretValue
      const deleteNotificationToken = yield* createDeleteNotificationToken
      const deleteNotificationSecret = yield* createDeleteNotificationSecret

      return {
        saveNotificationTokenSecret,
        saveNotificationToken,
        updateClientInfo,
        findSecretByNotificationToken,
        findAllTokensForSecret,
        findSecretBySecretValue,
        deleteNotificationToken,
        deleteNotificationSecret,
      }
    })
  )
}
