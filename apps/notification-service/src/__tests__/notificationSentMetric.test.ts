import {NotificationsStreamClientInfo} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {type MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {Deferred, Effect, Layer, Schema} from 'effect'
import {NotificationMetricsService} from '../metrics'
import {
  NewChatMessageNoticeSendTask,
  newStreamConnectionId,
  UserInactivityNoticeSendTask,
  type SendMessageTask,
} from '../services/NotificationSocketMessaging/domain'
import {LocalConnectionRegistry} from '../services/NotificationSocketMessaging/services/LocalConnectionRegistry'
import {TaskProcessor} from '../services/NotificationSocketMessaging/services/SendMessageTaskProcessor'

const connectionInfo = Schema.decodeSync(NotificationsStreamClientInfo)({
  notificationToken: 'vexl_nt_secret_test',
  version: 900,
  platform: 'ANDROID',
  connectionKind: 'background',
})

const reportedMetricForTask = (
  task: SendMessageTask
): Effect.Effect<MetricsMessage> =>
  Effect.gen(function* (_) {
    const reported = yield* _(Deferred.make<MetricsMessage>())

    const layer = TaskProcessor.Live.pipe(
      Layer.provideMerge(LocalConnectionRegistry.Live),
      Layer.provide(NotificationMetricsService.Live),
      Layer.provide(
        Layer.succeed(MetricsClientService, {
          reportMetric: (message) =>
            Deferred.succeed(reported, message).pipe(Effect.asVoid),
        })
      )
    )

    return yield* _(
      Effect.gen(function* (_) {
        const registry = yield* _(LocalConnectionRegistry)
        yield* _(
          registry.registerConnection(
            {
              connectionInfo,
              send: () => Effect.succeed(true),
              kickOut: () => Effect.void,
            },
            newStreamConnectionId()
          )
        )

        const processTask = yield* _(TaskProcessor)
        yield* _(processTask(task))

        return yield* _(Deferred.await(reported))
      }).pipe(Effect.provide(layer), Effect.scoped)
    )
  })

describe('NOTIFICATION_SENT metric', () => {
  it.each([
    new NewChatMessageNoticeSendTask({
      notificationToken: connectionInfo.notificationToken,
      sendNewChatMessageNotification: true,
    }),
    new UserInactivityNoticeSendTask({
      notificationToken: connectionInfo.notificationToken,
      targetToken: null,
    }),
  ])('reports the send task type of $_tag', async (task) => {
    const metric = await Effect.runPromise(reportedMetricForTask(task))

    expect(metric.name).toBe('NOTIFICATION_SENT')
    expect(metric.attributes).toEqual(
      expect.objectContaining({
        channel: 'background_socket',
        sendTaskType: task._tag,
      })
    )
  })
})
