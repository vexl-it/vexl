import {type NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  RedisError,
  RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {Array, Context, Effect, Layer, Option} from 'effect'
import {
  notificationOfflineBufferMaxCountConfig,
  notificationOfflineBufferTtlHoursConfig,
} from '../../configs'
import {SupportedPushNotificationTask} from '../../domain'
import {NotificationTokensDb} from '../NotificationTokensDb'

const KEY_PREFIX = 'notification-service:offline-buffer:'
const TRACKING_KEY_PREFIX = 'notification-service:offline-buffer-tracking:'

const createRedisKey = (secret: VexlNotificationTokenSecret): string =>
  `${KEY_PREFIX}${secret}`

const createTrackingKey = (trackingId: NotificationTrackingId): string =>
  `${TRACKING_KEY_PREFIX}${trackingId}`

/**
 * Buffers notifications for users who rely on the background notification
 * socket (no push fallback). Tasks are buffered at issue time - a socket
 * "delivery" only means the message was enqueued for a connection that may
 * already be dead (e.g. airplane mode), so delivery can only be trusted once
 * the client reports the notification as processed, which removes the entry.
 * Whatever is left in the buffer is replayed when the background socket
 * reconnects and discarded when the foreground socket connects (an open app
 * syncs everything itself).
 */
export interface OfflineNotificationBufferOperations {
  /**
   * Buffers the task if the recipient reported the background socket as
   * enabled. Best-effort - failures are logged, never propagated, so callers
   * can keep their delivery flow unchanged.
   */
  bufferTaskIfEnabled: (
    task: SupportedPushNotificationTask
  ) => Effect.Effect<void>

  /**
   * Removes a buffered task once the client confirmed processing it.
   * Best-effort - a missed removal only causes a redundant replay.
   */
  removeBufferedTaskByTrackingId: (
    trackingId: NotificationTrackingId
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
      const getSortedSet = redis.getSortedSet(SupportedPushNotificationTask)
      const removeFromSortedSet = redis.removeFromSortedSet(
        SupportedPushNotificationTask
      )
      const getAndDropSortedSet = redis.getAndDropSortedSet(
        SupportedPushNotificationTask
      )
      const setTrackingSecret = redis.set(VexlNotificationTokenSecret)
      const getTrackingSecret = redis.get(VexlNotificationTokenSecret)

      const addTaskToBuffer = (
        task: SupportedPushNotificationTask
      ): Effect.Effect<void, RedisError> => {
        const key = createRedisKey(task.notificationToken)
        return addToSortedSet(key, task, task.sentAt).pipe(
          Effect.zipRight(redis.trimSortedSetToNewest(key, maxCount)),
          Effect.zipRight(
            redis.setExpiresAt(key, unixMillisecondsFromNow(ttlMs))
          ),
          Effect.zipRight(
            setTrackingSecret(
              createTrackingKey(task.trackingId),
              task.notificationToken,
              {expiresAt: unixMillisecondsFromNow(ttlMs)}
            )
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

        removeBufferedTaskByTrackingId: (trackingId) =>
          getTrackingSecret(createTrackingKey(trackingId)).pipe(
            Effect.flatMap((secret) => {
              const key = createRedisKey(secret)
              return getSortedSet(key, 'asc').pipe(
                Effect.map(
                  Array.filter((task) => task.trackingId === trackingId)
                ),
                Effect.flatMap((tasks) =>
                  Array.isNonEmptyReadonlyArray(tasks)
                    ? removeFromSortedSet(key, Array.copy(tasks))
                    : Effect.void
                ),
                Effect.zipRight(redis.delete(createTrackingKey(trackingId)))
              )
            }),
            // No tracking record means nothing was buffered for this id
            Effect.catchTag('NoSuchElementException', () => Effect.void),
            Effect.catchAll((e) =>
              Effect.logWarning(
                'Failed to remove processed notification from offline buffer',
                {errorTag: e._tag}
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
