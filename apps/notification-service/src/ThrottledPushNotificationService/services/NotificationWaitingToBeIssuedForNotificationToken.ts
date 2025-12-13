import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  RedisError,
  RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {Context, Duration, Effect, Layer} from 'effect'
import {ThrottlePushNotificationServiceTask} from '../doamin'

const KEY_PREFIX = 'notification-service:waiting-notifications:'
const TTL_MS = Duration.toMillis(Duration.decode('1 day'))

const createRedisKey = (token: ExpoNotificationToken): string =>
  `${KEY_PREFIX}${token}`

export interface NotificationWaitingToBeIssuedForNotificationTokenOperations {
  addNotificationToWaitingList: (
    task: ThrottlePushNotificationServiceTask
  ) => Effect.Effect<void, RedisError>

  getAndClearWaitingListForToken: (
    notificationToken: ExpoNotificationToken
  ) => Effect.Effect<readonly ThrottlePushNotificationServiceTask[], RedisError>
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
        ThrottlePushNotificationServiceTask
      )
      const getAndDropSortedSet = redis.getAndDropSortedSet(
        ThrottlePushNotificationServiceTask
      )

      return {
        addNotificationToWaitingList: (task) => {
          const key = createRedisKey(task.token)
          return addToSortedSet(key, task, task.task.sentAt).pipe(
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
