import {vexlNotificationTokenToExpoToken} from '@vexl-next/domain/src/utility/VexlNotificationToken'
import {Context, Effect, Layer, pipe} from 'effect/index'
import {ExpoNotificationService} from '../../utils'
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
          localConnectionRegistry.findConnection(task.notificationToken),
          Effect.flatMap((connection) => connection.send(task.socketMessage)),
          Effect.isSuccess
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
