import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type VexlNotificationToken} from '@vexl-next/domain/src/utility/VexlNotificationToken'
import {type NotificationsStreamClientInfo} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Context, Effect, Layer} from 'effect'
import {type NoSuchElementException} from 'effect/Cause'
import {ConnectionRedisRecord} from '../domain'
import {MyManagerIdProvider} from './MyManagerIdProvider'

const CONNECTION_KEY_PREFIX = 'notification-service:notification-socket:'

const createRedisKey = (notificationToken: VexlNotificationToken): string =>
  `${CONNECTION_KEY_PREFIX}_${notificationToken}`

// Connection expiration time in milliseconds (5 minutes)
const CONNECTION_TTL_MS = 5 * 60 * 1000

interface RedisConnectionRegistryOperations {
  registerConnection: (
    clientInfo: NotificationsStreamClientInfo
  ) => Effect.Effect<ConnectionRedisRecord, UnexpectedServerError>
  keepAlive: (
    notificationToken: VexlNotificationToken
  ) => Effect.Effect<void, UnexpectedServerError>
  getConnectionForToken: (
    notificationToken: VexlNotificationToken
  ) => Effect.Effect<
    ConnectionRedisRecord,
    NoSuchElementException | UnexpectedServerError
  >
  removeConnection: (
    notificationToken: VexlNotificationToken
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class RedisConnectionRegistry extends Context.Tag(
  'RedisConnectionRegistry'
)<RedisConnectionRegistry, RedisConnectionRegistryOperations>() {
  static readonly Live = Layer.effect(
    RedisConnectionRegistry,
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)
      const storeConnection = redis.set(ConnectionRedisRecord)
      const getConnection = redis.get(ConnectionRedisRecord)
      const myManagerId = yield* _(MyManagerIdProvider)

      return {
        registerConnection: (clientInfo) => {
          const record: ConnectionRedisRecord = {
            clientInfo,
            managerId: myManagerId,
          }
          const key = createRedisKey(clientInfo.notificationToken)

          return storeConnection(key, record, {
            expiresAt: unixMillisecondsFromNow(CONNECTION_TTL_MS),
          }).pipe(
            Effect.catchAll((e) =>
              Effect.zipRight(
                Effect.logError('Error while registering connection', e),
                Effect.fail(new UnexpectedServerError({status: 500}))
              )
            ),
            Effect.as(record)
          )
        },

        keepAlive: (notificationToken) => {
          const key = createRedisKey(notificationToken)

          return redis
            .setExpiresAt(key, unixMillisecondsFromNow(CONNECTION_TTL_MS))
            .pipe(
              Effect.catchTags({
                NoSuchElementException: () => Effect.void,
                RedisError: (e) =>
                  Effect.zipRight(
                    Effect.logError('Error while keeping connection alive', e),
                    Effect.fail(new UnexpectedServerError({status: 500}))
                  ),
              })
            )
        },

        getConnectionForToken: (notificationToken) => {
          const key = createRedisKey(notificationToken)

          return getConnection(key).pipe(
            Effect.catchTags({
              ParseError: (e) =>
                Effect.zipRight(
                  Effect.logError('Error while parsing connection record', e),
                  Effect.fail(new UnexpectedServerError({status: 500}))
                ),
              RedisError: (e) =>
                Effect.zipRight(
                  Effect.logError('Error while getting connection', e),
                  Effect.fail(new UnexpectedServerError({status: 500}))
                ),
            })
          )
        },

        removeConnection: (notificationToken) => {
          const key = createRedisKey(notificationToken)

          return redis
            .delete(key)
            .pipe(
              Effect.catchAll((e) =>
                Effect.zipRight(
                  Effect.logError('Error while removing connection', e),
                  Effect.fail(new UnexpectedServerError({status: 500}))
                )
              )
            )
        },
      }
    })
  )
}
