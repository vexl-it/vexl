import {SqlClient, SqlResolver, SqlSchema} from '@effect/sql'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  VexlNotificationToken,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformName} from '@vexl-next/rest-api'
import {AppSource} from '@vexl-next/rest-api/src/commonHeaders'
import {Effect, flow, Schema} from 'effect'
import {NotificationSecretRecord, NotificationTokenRecord} from './domain'

const CreateNotificationTokenParams = Schema.Struct({
  secret: VexlNotificationTokenSecret,
  expoNotificationToken: Schema.NullOr(ExpoNotificationToken),
  clientPlatform: PlatformName,
  clientVersion: VersionCode,
  clientAppSource: AppSource,
  clientLanguage: Schema.String,
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
})
export type CreateNotificationTokenParams =
  typeof CreateNotificationTokenParams.Type

const SaveNotificationTokenParams = Schema.Struct({
  token: VexlNotificationToken,
  secretId: Schema.BigInt,
})
export type SaveNotificationTokenParams =
  typeof SaveNotificationTokenParams.Type

export const UpdateClientInfoParams = Schema.Struct({
  secretToken: VexlNotificationTokenSecret,
  expoNotificationToken: Schema.NullOr(ExpoNotificationToken),
  clientPlatform: PlatformName,
  clientVersion: VersionCode,
  clientAppSource: AppSource,
  clientLanguage: Schema.String,
})
export type UpdateClientInfoParams = typeof UpdateClientInfoParams.Type

// --- Save Notification Token Secret ---
export const createSaveNotificationTokenSecret = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const query = SqlSchema.single({
    Request: CreateNotificationTokenParams,
    Result: NotificationSecretRecord,
    execute: (params) => sql`
      INSERT INTO
        notification_token_secrets ${sql.insert(params)}
      RETURNING
        *
    `,
  })

  return flow(
    (params: CreateNotificationTokenParams) => query(params),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in saveNotificationTokenSecret', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('saveNotificationTokenSecret query')
  )
})

// --- Save Notification Token ---
export const createSaveNotificationToken = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const query = SqlSchema.single({
    Request: SaveNotificationTokenParams,
    Result: NotificationTokenRecord,
    execute: (params) => sql`
      INSERT INTO
        notification_tokens ${sql.insert(params)}
      RETURNING
        *
    `,
  })

  return flow(
    (params: SaveNotificationTokenParams) => query(params),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in saveNotificationToken', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('saveNotificationToken query')
  )
})

// --- Update Client Info ---
export const createUpdateClientInfo = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const query = SqlSchema.single({
    Request: UpdateClientInfoParams,
    Result: NotificationSecretRecord,
    execute: (params) => sql`
      UPDATE notification_token_secrets
      SET
        ${sql.update({
        expoNotificationToken: params.expoNotificationToken,
        clientPlatform: params.clientPlatform,
        clientVersion: params.clientVersion,
        clientAppSource: params.clientAppSource,
        clientLanguage: params.clientLanguage,
        updatedAt: new Date(),
      })}
      WHERE
        secret = ${params.secretToken}
      RETURNING
        *
    `,
  })

  return flow(
    (params: UpdateClientInfoParams) => query(params),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateClientInfo', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateClientInfo query')
  )
})

// --- Find Secret By Notification Token ---
export const createFindSecretByNotificationToken = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const query = SqlSchema.findOne({
    Request: VexlNotificationToken,
    Result: NotificationSecretRecord,
    execute: (token) => sql`
      SELECT
        ns.*
      FROM
        notification_token_secrets ns
        INNER JOIN notification_tokens nt ON nt.secret_id = ns.id
      WHERE
        nt.token = ${token}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findSecretByNotificationToken', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findSecretByNotificationToken query')
  )
})

// --- Find All Tokens For Secret ---
export const createFindAllTokensForSecret = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const query = SqlSchema.findAll({
    Request: VexlNotificationTokenSecret,
    Result: NotificationTokenRecord,
    execute: (secret) => sql`
      SELECT
        nt.*
      FROM
        notification_tokens nt
        INNER JOIN notification_token_secrets ns ON ns.id = nt.secret_id
      WHERE
        ns.secret = ${secret}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findAllTokensForSecret', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findAllTokensForSecret query')
  )
})

// --- Find Secret By Secret Value ---
export const createFindSecretBySecretValue = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const query = SqlSchema.findOne({
    Request: VexlNotificationTokenSecret,
    Result: NotificationSecretRecord,
    execute: (secret) => sql`
      SELECT
        *
      FROM
        notification_token_secrets
      WHERE
        secret = ${secret}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findSecretBySecretValue', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findSecretBySecretValue query')
  )
})

// --- Delete Notification Token ---
export const createDeleteNotificationToken = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const resolver = yield* SqlResolver.void('deleteNotificationToken', {
    Request: VexlNotificationToken,
    execute: (params) => sql`
      DELETE FROM notification_tokens
      WHERE
        ${sql.in('token', params)}
    `,
  })

  return flow(
    resolver.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in deleteNotificationToken', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteNotificationToken query')
  )
})

// --- Delete Notification Secret ---
export const createDeleteNotificationSecret = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const resolver = yield* SqlResolver.void('deleteNotificationSecret', {
    Request: VexlNotificationTokenSecret,
    execute: (params) => sql`
      DELETE FROM notification_token_secrets
      WHERE
        ${sql.in('secret', params)}
    `,
  })

  return flow(
    resolver.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in deleteNotificationSecret', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteNotificationSecret query')
  )
})
