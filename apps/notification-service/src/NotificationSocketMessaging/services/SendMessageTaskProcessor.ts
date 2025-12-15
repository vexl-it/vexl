import {Array, Context, Effect, flow, identity, Layer, pipe} from 'effect/index'
import {ExpoNotificationService} from '../../utils'
import {vexlNotificationTokenToExpoToken, type SendMessageTask} from '../domain'
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
      const expoNotificationService = yield* _(ExpoNotificationService)

      return (task: SendMessageTask) => {
        if (task._tag === 'NewChatMessageNoticeSendTask')
          return pipe(
            vexlNotificationTokenToExpoToken(task.notificationToken),

            Effect.flatMap((expoToken) =>
              expoNotificationService.sendNotificationViaExpoNotification(
                expoToken,
                task.targetCypher,
                task.sendNewChatMessageNotification
              )
            ),
            Effect.ignore
          )
        return Effect.void
      }
    })
  )
}

export const TaskProcessorsLive = Layer.mergeAll(
  TaskProcessor.Live,
  TimeoutProcessor.Live
)
