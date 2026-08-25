import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  RedisError,
  RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {Context, Effect, Layer, Option} from 'effect'
import {
  notificationOfflineBufferMaxCountConfig,
  notificationOfflineBufferTtlHoursConfig,
} from '../../configs'
import {SupportedPushNotificationTask} from '../../domain'
import {NotificationTokensDb} from '../NotificationTokensDb'

const KEY_PREFIX = 'notification-service:offline-buffer:'

const createRedisKey = (secret: VexlNotificationTokenSecret): string =>
  `${KEY_PREFIX}${secret}`

/**
 * Buffers notifications that could not be delivered over the socket for users
 * who rely on the background notification socket (no push fallback). The
 * buffer is replayed when their background socket reconnects and discarded
 * when their foreground socket connects (an open app syncs everything itself).
 */
export interface OfflineNotificationBufferOperations {
  /**
   * Buffers the task if the recipient reported the background socket as
   * enabled. Best-effort - failures are logged, never propagated, so callers
   * can keep their push fallback flow unchanged.
   */
  bufferTaskIfEnabled: (
    task: SupportedPushNotificationTask
  ) => Effect.Effect<void>

  getAndClearBufferedTasks: (
    secret: VexlNotificationTokenSecret
  ) => Effect.Effect<readonly SupportedPushNotificationTask[], RedisError>

  clearBufferedTasks: (
    secret: VexlNotificationTokenSecret
  ) => Effect.Effect<void, RedisError>
}

export class OfflineNotificationBuffer extends Context.Tag(
  'OfflineNotificationBuffer'
)<OfflineNotificationBuffer, OfflineNotificationBufferOperations>() {
  static readonly Live = Layer.effect(
    OfflineNotificationBuffer,
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)
      const notificationTokensDb = yield* _(NotificationTokensDb)

      const ttlHours = yield* _(notificationOfflineBufferTtlHoursConfig)
      const maxCount = yield* _(notificationOfflineBufferMaxCountConfig)
      const bufferingEnabled = ttlHours !== -1
      const ttlMs = ttlHours * 60 * 60 * 1000

      const addToSortedSet = redis.addIntoSortedSet(
        SupportedPushNotificationTask
      )
      const getAndDropSortedSet = redis.getAndDropSortedSet(
        SupportedPushNotificationTask
      )

      const addTaskToBuffer = (
        task: SupportedPushNotificationTask
      ): Effect.Effect<void, RedisError> => {
        const key = createRedisKey(task.notificationToken)
        return addToSortedSet(key, task, task.sentAt).pipe(
          Effect.zipRight(redis.trimSortedSetToNewest(key, maxCount)),
          Effect.zipRight(
            redis.setExpiresAt(key, unixMillisecondsFromNow(ttlMs))
          ),
          Effect.catchTag('NoSuchElementException', () => Effect.void),
          Effect.catchTag('ParseError', (e) =>
            Effect.fail(new RedisError({cause: e}))
          )
        )
      }

      return {
        bufferTaskIfEnabled: (task) =>
          !bufferingEnabled
            ? Effect.void
            : notificationTokensDb
                .findSecretBySecretValue(task.notificationToken)
                .pipe(
                  Effect.flatMap(
                    Option.match({
                      onNone: () => Effect.void,
                      onSome: (secretRecord) =>
                        secretRecord.backgroundSocketEnabled
                          ? addTaskToBuffer(task)
                          : Effect.void,
                    })
                  ),
                  // Do not log the error itself - it may contain the
                  // notification secret (redis key / task payload).
                  Effect.catchAll((e) =>
                    Effect.logError(
                      'Failed to buffer undelivered notification',
                      {errorTag: e._tag, taskType: task._tag}
                    )
                  )
                ),

        getAndClearBufferedTasks: (secret) =>
          getAndDropSortedSet(createRedisKey(secret), 'asc').pipe(
            Effect.catchTag('ParseError', (e) =>
              Effect.fail(new RedisError({cause: e}))
            )
          ),

        clearBufferedTasks: (secret) =>
          redis.clearSortedSet(createRedisKey(secret)),
      }
    })
  )
}
