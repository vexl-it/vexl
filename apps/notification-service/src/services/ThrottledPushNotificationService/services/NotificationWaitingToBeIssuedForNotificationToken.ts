import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  RedisError,
  RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {Context, Duration, Effect, Layer} from 'effect'
import {SupportedPushNotificationTask} from '../../../domain'

const KEY_PREFIX = 'notification-service:waiting-notifications:'
const TTL_MS = Duration.toMillis(Duration.decode('1 day'))

const createRedisKey = (token: VexlNotificationToken): string =>
  `${KEY_PREFIX}${token}`

export interface NotificationWaitingToBeIssuedForNotificationTokenOperations {
  addNotificationToWaitingList: (
    task: SupportedPushNotificationTask
  ) => Effect.Effect<void, RedisError>

  getAndClearWaitingListForToken: (
    notificationToken: VexlNotificationToken
  ) => Effect.Effect<readonly SupportedPushNotificationTask[], RedisError>
}

export class NotificationWaitingToBeIssuedForNotificationToken extends Context.Tag(
  'NotificationWaitingToBeIssuedForNotificationToken'
)<
  NotificationWaitingToBeIssuedForNotificationToken,
  NotificationWaitingToBeIssuedForNotificationTokenOperations
>() {
  static readonly Live = Layer.effect(
    NotificationWaitingToBeIssuedForNotificationToken,
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)

      const addToSortedSet = redis.addIntoSortedSet(
        SupportedPushNotificationTask
      )
      const getAndDropSortedSet = redis.getAndDropSortedSet(
        SupportedPushNotificationTask
      )

      return {
        addNotificationToWaitingList: (task) => {
          const key = createRedisKey(task.notificationToken)
          return addToSortedSet(key, task, task.sentAt).pipe(
            Effect.tap(() =>
              redis.setExpiresAt(key, unixMillisecondsFromNow(TTL_MS))
            ),
            Effect.catchTag('NoSuchElementException', () => Effect.void),
            Effect.catchTag('ParseError', (e) =>
              Effect.zipRight(
                Effect.logError('Error adding notification to waiting list', e),
                Effect.fail(new RedisError({cause: e}))
              )
            )
          )
        },

        getAndClearWaitingListForToken: (notificationToken) => {
          const key = createRedisKey(notificationToken)
          return getAndDropSortedSet(key, 'asc').pipe(
            Effect.catchTag('ParseError', (e) =>
              Effect.zipRight(
                Effect.logError(
                  'Error getting waiting notifications for token',
                  e
                ),
                Effect.fail(new RedisError({cause: e}))
              )
            )
          )
        },
      }
    })
  )
}
