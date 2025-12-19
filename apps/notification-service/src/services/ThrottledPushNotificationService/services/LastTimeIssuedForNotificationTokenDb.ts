import {
  UnixMillisecondsE,
  unixMillisecondsFromNow,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  RedisError,
  RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {Context, Duration, Effect, Layer} from 'effect'
import {type NoSuchElementException} from 'effect/Cause'
import {type VexlNotificationToken} from '../../NotificationSocketMessaging/domain'

const KEY_PREFIX = 'notification-service:last-issued:'
const TTL_MS = Duration.toMillis(Duration.decode('1 day'))

const createRedisKey = (token: VexlNotificationToken): string =>
  `${KEY_PREFIX}${token}`

export interface LastTimeIssuedForNotificationTokenDbOperations {
  getLastTimeIssuedForNotificationToken: (
    token: VexlNotificationToken
  ) => Effect.Effect<UnixMilliseconds, RedisError | NoSuchElementException>
  deleteLastTimeIssuedForNotificationToken: (
    token: VexlNotificationToken
  ) => Effect.Effect<void, RedisError>
  setLastTimeIssuedForNotificationToken: (
    token: VexlNotificationToken,
    time: UnixMilliseconds
  ) => Effect.Effect<void, RedisError>
}

export class LastTimeIssuedForNotificationTokenDb extends Context.Tag(
  'LastTimeIssuedForNotificationTokenDb'
)<
  LastTimeIssuedForNotificationTokenDb,
  LastTimeIssuedForNotificationTokenDbOperations
>() {
  static readonly Live = Layer.effect(
    LastTimeIssuedForNotificationTokenDb,
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)

      const getValue = redis.get(UnixMillisecondsE)
      const setValue = redis.set(UnixMillisecondsE)

      return {
        getLastTimeIssuedForNotificationToken: (token) => {
          const key = createRedisKey(token)

          return getValue(key).pipe(
            Effect.catchTag('ParseError', (e) =>
              Effect.zipRight(
                Effect.logError('Error parsing last issued time', e),
                Effect.fail(new RedisError({cause: e}))
              )
            )
          )
        },

        setLastTimeIssuedForNotificationToken: (token, time) => {
          const key = createRedisKey(token)

          return setValue(key, time, {
            expiresAt: unixMillisecondsFromNow(TTL_MS),
          }).pipe(
            Effect.catchTag('ParseError', (e) =>
              Effect.zipRight(
                Effect.logError('Error setting last issued time', e),
                Effect.fail(new RedisError({cause: e}))
              )
            )
          )
        },
        deleteLastTimeIssuedForNotificationToken: (token) => {
          const key = createRedisKey(token)
          return redis.delete(key)
        },
      }
    })
  )
}
