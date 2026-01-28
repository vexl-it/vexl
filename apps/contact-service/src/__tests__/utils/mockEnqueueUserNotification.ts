import {
  EnqueueUserNotification,
  type UserNotificationMqEntry,
} from '@vexl-next/server-utils/src/UserNotificationMq'
import {type Job, type JobsOptions} from 'bullmq'
import {Effect, Layer, Ref} from 'effect'

export interface EnqueuedNotification {
  task: typeof UserNotificationMqEntry.Type
  options?: JobsOptions
}

// Ref to store enqueued notifications for test assertions
export const enqueuedNotificationsRef = Ref.unsafeMake<EnqueuedNotification[]>(
  []
)

export const clearEnqueuedNotifications = Ref.set(enqueuedNotificationsRef, [])

export const getEnqueuedNotifications = Ref.get(enqueuedNotificationsRef)

export const mockedEnqueueUserNotificationLayer = Layer.succeed(
  EnqueueUserNotification,
  (task, options) =>
    Ref.update(enqueuedNotificationsRef, (arr) => [
      ...arr,
      {task, options},
    ]).pipe(Effect.as({} as Job))
)
