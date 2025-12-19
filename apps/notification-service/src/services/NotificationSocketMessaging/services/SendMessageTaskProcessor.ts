import {Array, Context, Effect, flow, identity, Layer, pipe} from 'effect/index'
import {ThrottledPushNotificationService} from '../../ThrottledPushNotificationService'
import {type SendMessageTask} from '../domain'
import {LocalConnectionRegistry} from './LocalConnectionRegistry'

export class TaskProcessor extends Context.Tag('TaskProcessor')<
  TaskProcessor,
  (task: SendMessageTask) => Effect.Effect<boolean>
>() {
  static Live = Layer.effect(
    TaskProcessor,
    Effect.gen(function* (_) {
      const localConnectionRegistry = yield* _(LocalConnectionRegistry)

      return (task: SendMessageTask) =>
        pipe(
          localConnectionRegistry.findConnectionForNotificationToken(
            task.notificationToken
          ),
          Effect.flatMap(
            flow(
              Array.map((connection) => connection.send(task.socketMessage)),
              Effect.allWith({concurrency: 'unbounded'})
            )
          ),
          Effect.map((results) => results.some(identity)),
          Effect.catchTag('NoSuchElementException', () => Effect.succeed(false))
        )
    })
  )
}

export class TimeoutProcessor extends Context.Tag('TimeoutProcessor')<
  TimeoutProcessor,
  (task: SendMessageTask) => Effect.Effect<void>
>() {
  static Live = Layer.effect(
    TimeoutProcessor,
    Effect.gen(function* (_) {
      const {issuePushNotification} = yield* _(ThrottledPushNotificationService)

      return (task: SendMessageTask) => {
        if (task._tag === 'NewChatMessageNoticeSendTask')
          return pipe(issuePushNotification(task), Effect.ignore)

        // we don't process other task types for now
        return Effect.void
      }
    })
  )
}

export const TaskProcessorsLive = Layer.mergeAll(
  TaskProcessor.Live,
  TimeoutProcessor.Live
)
