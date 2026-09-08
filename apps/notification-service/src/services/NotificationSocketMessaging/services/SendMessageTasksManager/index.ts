import {
  type UnixMilliseconds,
  unixMillisecondsFromNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {RedisPubSubService} from '@vexl-next/server-utils/src/RedisPubSubService'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {
  Array,
  Context,
  Duration,
  Effect,
  flow,
  identity,
  Layer,
  pipe,
  Result,
  Schema,
  Stream,
} from 'effect'
import {type NotificationMetricsService} from '../../../../metrics'
import {type ThrottledPushNotificationService} from '../../../ThrottledPushNotificationService'
import {
  type ConnectionManagerChannelId,
  SendMessageTask,
  type SendMessageTaskId,
} from '../../domain'
import {type LocalConnectionRegistry} from '../LocalConnectionRegistry'
import {MyManagerIdProvider} from '../MyManagerIdProvider'
import {
  TaskProcessor,
  TaskProcessorsLive,
  TimeoutProcessor,
} from '../SendMessageTaskProcessor'
import {SendMessageTasksManagerError} from './domain'
import {EnqueuePendingTask, TimeoutJobsStream} from './utils'

export interface SendMessageTasksManagerOperations {
  emitTask: (
    task: SendMessageTask,
    ...managerId: Array.NonEmptyArray<ConnectionManagerChannelId>
  ) => Effect.Effect<void, SendMessageTasksManagerError>
}

const createPendingTaskKey = (taskId: SendMessageTaskId): string =>
  `notification-service:pendingTask:${taskId}`

export const TaskWorkerLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const redisPubSub = yield* RedisPubSubService
    const redis = yield* RedisService
    const myPubSubChannel = yield* MyManagerIdProvider
    const processTask = yield* TaskProcessor

    const deletePendingFromRedis = flow(
      createPendingTaskKey,
      redis.delete,
      SendMessageTasksManagerError.wrapErrors(
        'Error while deleting pending task from redis'
      )
    )

    yield* pipe(
      redisPubSub.subscribe(SendMessageTask)(myPubSubChannel),
      Stream.flatMap(
        (task) =>
          Stream.fromEffect(
            processTask(task).pipe(
              Effect.filterOrFail(identity),
              Effect.zip(
                deletePendingFromRedis(task.id).pipe(
                  Effect.tapError((e) =>
                    Effect.logWarning(
                      'Failed to delete pending task from redis',
                      e
                    )
                  )
                )
              ),
              Effect.ignore
            )
          ),
        {concurrency: 20, bufferSize: 100}
      ),
      Stream.runDrain,
      Effect.tapError((e) =>
        Effect.logError('Send message tasks worker failed', e)
      ),
      Effect.catchTag(
        'RedisError',
        (e) =>
          new SendMessageTasksManagerError({
            cause: e,
            message: 'Redis error when subcribing to redis pubsub channel',
          })
      )
    )
  })
)

export const TimeoutWorkerLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const jobsStream = yield* TimeoutJobsStream
    const redis = yield* RedisService
    const processTimeout = yield* TimeoutProcessor

    yield* pipe(
      jobsStream,
      Stream.filterEffect((task) =>
        // If the pending task is still recorded in redis, process it
        redis
          .exists(createPendingTaskKey(task.id))
          .pipe(
            SendMessageTasksManagerError.wrapErrors(
              'Error while checking pending task existence in redis'
            )
          )
      ),
      Stream.flatMap(
        (data) =>
          Stream.fromEffect(
            Effect.zip(
              processTimeout(data),
              redis
                .delete(createPendingTaskKey(data.id))
                .pipe(
                  SendMessageTasksManagerError.wrapErrors(
                    'Error while checking pending task existence in redis'
                  )
                )
            )
          ),
        {concurrency: 10, bufferSize: 100}
      ),
      Stream.runDrain,
      Effect.tapError((e) =>
        Effect.logError('Pending task timeout worker failed', e)
      )
    )
  })
)

export class SendMessageTasksManager extends Context.Service<
  SendMessageTasksManager,
  SendMessageTasksManagerOperations
>()('SendMessageTasksManager') {
  static layer = ({
    timeout,
  }: {
    timeout: Duration.Input
  }): Layer.Layer<
    | TaskProcessor
    | TimeoutJobsStream
    | TimeoutProcessor
    | SendMessageTasksManager
    | EnqueuePendingTask,
    SendMessageTasksManagerError,
    | RedisPubSubService
    | RedisService
    | RedisConnectionService
    | LocalConnectionRegistry
    | NotificationMetricsService
    | ThrottledPushNotificationService
  > =>
    Layer.effect(
      SendMessageTasksManager,
      Effect.gen(function* () {
        const timeoutMs = Duration.toMillis(timeout)
        const recordExpiration = (): UnixMilliseconds =>
          unixMillisecondsFromNow(timeoutMs + 60_000)

        const redis = yield* RedisService
        const insertAsPendingToRedis = (
          task: SendMessageTask
        ): Effect.Effect<void, SendMessageTasksManagerError, never> =>
          pipe(
            redis.set(Schema.Literal('pending'))(
              createPendingTaskKey(task.id),
              'pending',
              {
                expiresAt: recordExpiration(),
              }
            ),
            SendMessageTasksManagerError.wrapErrors(
              'Error while inserting pending task to redis'
            )
          )

        const redisPubSub = yield* RedisPubSubService

        const publishTask = (
          task: SendMessageTask,
          senderChannel: ConnectionManagerChannelId
          // TODO publish to correct channel
        ): Effect.Effect<void, SendMessageTasksManagerError, never> =>
          redisPubSub
            .publish(SendMessageTask)(senderChannel, task)
            .pipe(
              SendMessageTasksManagerError.wrapErrors(
                'Error while publishing task to pub/sub'
              )
            )

        const enqueueTimeout = yield* EnqueuePendingTask

        return {
          emitTask: (task, ...managerIds) => {
            const insertTaskAndEnqueueTimeout = Effect.zip(
              insertAsPendingToRedis(task),
              enqueueTimeout(task, {delay: timeoutMs})
            )

            const publishToManagers = pipe(
              managerIds,
              Array.map((managerId) =>
                publishTask(task, managerId).pipe(
                  Effect.tapError((e) =>
                    Effect.logError(
                      'Error while publishing task to manager',
                      managerId,
                      e
                    )
                  )
                )
              ),
              (effects) =>
                Effect.all(effects, {concurrency: 'unbounded', mode: 'result'}),
              // At least one manager must have received the task
              Effect.filterOrFail(
                Array.some(Result.isSuccess),
                (e) =>
                  new SendMessageTasksManagerError({
                    'cause': Array.getFailures(e),
                    'message': 'Failed to emit task to any manager',
                  })
              )
            )

            return Effect.andThen(
              insertTaskAndEnqueueTimeout,
              publishToManagers
            )
          },
        }
      })
    ).pipe(
      Layer.provideMerge(TimeoutJobsStream.Live),
      Layer.provideMerge(EnqueuePendingTask.Live),
      Layer.provideMerge(TaskProcessorsLive)
    )
}
