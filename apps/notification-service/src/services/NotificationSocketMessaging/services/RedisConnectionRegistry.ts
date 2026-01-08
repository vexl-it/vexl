import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  RedisService,
  type RedisError,
} from '@vexl-next/server-utils/src/RedisService'
import {Array, Context, Effect, flow, identity, Layer} from 'effect'
import {type NoSuchElementException} from 'effect/Cause'
import {type ParseError} from 'effect/ParseResult'
import {
  ConnectionRedisRecord,
  StreamConnectionId,
  type ClientInfo,
} from '../domain'
import {MyManagerIdProvider} from './MyManagerIdProvider'

const CONNECTION_ID_TO_MANAGER_ID = 'notification-service:connection-id-info:'
const NOTIFICATION_TOKENS_TO_CONNECTION_IDS =
  'notification-service:token-to-connection-ids:'

const createConnectionIdToClientInfoKey = (
  connectionId: StreamConnectionId
): string => `${CONNECTION_ID_TO_MANAGER_ID}${connectionId}`

const createTokenToConnectionIdKey = (
  notificationToken: VexlNotificationTokenSecret
): string => `${NOTIFICATION_TOKENS_TO_CONNECTION_IDS}${notificationToken}`

// Connection expiration time in milliseconds (5 minutes)
const CONNECTION_TTL_MS = 5 * 60 * 1000

interface RedisConnectionRegistryOperations {
  registerConnection: (
    connectionId: StreamConnectionId,
    clientInfo: ClientInfo
  ) => Effect.Effect<ConnectionRedisRecord, UnexpectedServerError>
  keepAlive: (
    connectionId: StreamConnectionId,
    notificationToken: VexlNotificationTokenSecret
  ) => Effect.Effect<void, UnexpectedServerError>
  getConnectionsForToken: (
    notificationToken: VexlNotificationTokenSecret
  ) => Effect.Effect<
    Array.NonEmptyArray<ConnectionRedisRecord>,
    NoSuchElementException | UnexpectedServerError
  >
  removeConnection: (
    connectionId: StreamConnectionId,
    notificationToken: VexlNotificationTokenSecret
  ) => Effect.Effect<void>
}

export class RedisConnectionRegistry extends Context.Tag(
  'RedisConnectionRegistry'
)<RedisConnectionRegistry, RedisConnectionRegistryOperations>() {
  static readonly Live = Layer.effect(
    RedisConnectionRegistry,
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)
      const myManagerId = yield* _(MyManagerIdProvider)

      const storeConnectionInfo = (
        redisConnection: ConnectionRedisRecord
      ): Effect.Effect<void, ParseError | RedisError, never> =>
        redis.set(ConnectionRedisRecord)(
          createConnectionIdToClientInfoKey(redisConnection.connectionId),
          redisConnection,
          {expiresAt: unixMillisecondsFromNow(CONNECTION_TTL_MS)}
        )
      const getConnectionInfo = (
        connectionId: StreamConnectionId
      ): Effect.Effect<
        ConnectionRedisRecord,
        ParseError | RedisError | NoSuchElementException
      > =>
        redis.get(ConnectionRedisRecord)(
          createConnectionIdToClientInfoKey(connectionId)
        )

      const deleteConnectionInfo = (
        connectionId: StreamConnectionId
      ): Effect.Effect<void, RedisError> =>
        redis.delete(createConnectionIdToClientInfoKey(connectionId))

      const storeConnectionId = ({
        notificationToken,
        connectionId,
      }: {
        notificationToken: VexlNotificationTokenSecret
        connectionId: StreamConnectionId
      }): Effect.Effect<void, ParseError | RedisError, never> =>
        redis.insertToSet(StreamConnectionId)(
          createTokenToConnectionIdKey(notificationToken),
          [connectionId],
          {expiresAt: unixMillisecondsFromNow(CONNECTION_TTL_MS)}
        )

      const getConnectionsIds = (
        notificationToken: VexlNotificationTokenSecret
      ): Effect.Effect<
        readonly [StreamConnectionId, ...StreamConnectionId[]],
        ParseError | RedisError | NoSuchElementException
      > =>
        redis.getSet(StreamConnectionId)(
          createTokenToConnectionIdKey(notificationToken)
        )

      const deleteConnectionId = ({
        notificationToken,
        connectionId,
      }: {
        notificationToken: VexlNotificationTokenSecret
        connectionId: StreamConnectionId
      }): Effect.Effect<void, ParseError | RedisError, never> =>
        redis.deleteFromSet(StreamConnectionId)(
          createTokenToConnectionIdKey(notificationToken),
          [connectionId]
        )

      return {
        registerConnection: (connectionId, clientInfo) => {
          const record: ConnectionRedisRecord = {
            connectionId,
            clientInfo,
            managerId: myManagerId,
          }

          return Effect.all([
            storeConnectionId({
              connectionId,
              notificationToken: clientInfo.notificationToken,
            }),
            storeConnectionInfo(record),
          ]).pipe(
            Effect.catchAll((e) =>
              Effect.zipRight(
                Effect.logError('Error while registering connection', e),
                Effect.fail(new UnexpectedServerError({status: 500}))
              )
            ),
            Effect.as(record)
          )
        },

        keepAlive: (connectionId, notificationToken) => {
          const connectionInfoKey =
            createConnectionIdToClientInfoKey(connectionId)
          const connectionIdKey =
            createTokenToConnectionIdKey(notificationToken)

          return Effect.all([
            redis.setExpiresAt(
              connectionInfoKey,
              unixMillisecondsFromNow(CONNECTION_TTL_MS)
            ),
            redis.setExpiresAt(
              connectionIdKey,
              unixMillisecondsFromNow(CONNECTION_TTL_MS)
            ),
          ]).pipe(
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

        getConnectionsForToken: (notificationToken) =>
          getConnectionsIds(notificationToken).pipe(
            Effect.flatMap(
              flow(
                Array.map(flow(getConnectionInfo, Effect.option)),
                Effect.all,
                Effect.map(Array.filterMap(identity))
              )
            ),
            Effect.filterOrFail(Array.isNonEmptyArray),
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
          ),
        removeConnection: (connectionId, notificationToken) => {
          return Effect.all([
            Effect.ignore(
              deleteConnectionId({connectionId, notificationToken})
            ),
            Effect.ignore(deleteConnectionInfo(connectionId)),
          ])
        },
      }
    })
  )
}
