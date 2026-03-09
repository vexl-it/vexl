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
  Either,
  flow,
  identity,
  Layer,
  pipe,
  Schema,
  Stream,
} from 'effect/index'
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
  Effect.gen(function* (_) {
    const redisPubSub = yield* _(RedisPubSubService)
    const redis = yield* _(RedisService)
    const myPubSubChannel = yield* _(MyManagerIdProvider)
    const processTask = yield* _(TaskProcessor)

    const deletePendingFromRedis = flow(
      createPendingTaskKey,
      redis.delete,
      SendMessageTasksManagerError.wrapErrors(
        'Error while deleting pending task from redis'
      )
    )

    yield* _(
      pipe(
        redisPubSub.subscribe(SendMessageTask)(myPubSubChannel),
        Stream.flatMap(
          (task) =>
            processTask(task).pipe(
              Effect.filterOrFail(identity),
              Effect.zip(deletePendingFromRedis(task.id)),
              Effect.ignore
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
    )
  })
)

export const TimeoutWorkerLayer = Layer.effectDiscard(
  Effect.gen(function* (_) {
    const jobsStream = yield* _(TimeoutJobsStream)
    const redis = yield* _(RedisService)
    const processTimeout = yield* _(TimeoutProcessor)

    yield* _(
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
          Effect.zip(
            processTimeout(data),
            redis
              .delete(createPendingTaskKey(data.id))
              .pipe(
                SendMessageTasksManagerError.wrapErrors(
                  'Error while checking pending task existence in redis'
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

export class SendMessageTasksManager extends Context.Tag(
  'SendMessageTasksManager'
)<SendMessageTasksManager, SendMessageTasksManagerOperations>() {
  static layer = ({
    timeout,
  }: {
    timeout: Duration.DurationInput
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
    | ThrottledPushNotificationService
  > =>
    Layer.scoped(
      SendMessageTasksManager,
      Effect.gen(function* (_) {
        const timeoutMs = Duration.toMillis(timeout)
        const recordExpiration = (): UnixMilliseconds =>
          unixMillisecondsFromNow(timeoutMs + 60_000)

        const redis = yield* _(RedisService)
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

        const redisPubSub = yield* _(RedisPubSubService)

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

        const enqueueTimeout = yield* _(EnqueuePendingTask)

        return {
          emitTask: (task, ...managerIds) => {
            const taskSummary = {
              managerIds,
              taskId: task.id,
              taskTag: task._tag,
              token: task.notificationToken,
            }
            const insertTaskAndEnqueueTimeout = Effect.zip(
              insertAsPendingToRedis(task),
              enqueueTimeout(task, {delay: timeoutMs})
            ).pipe(
              Effect.tap(() =>
                Effect.log(
                  'Notification Debug: Recorded task as pending and enqueued timeout',
                  taskSummary
                )
              )
            )

            const publishToManagers = pipe(
              managerIds,
              Array.map((managerId) =>
                publishTask(task, managerId).pipe(
                  Effect.tap(() =>
                    Effect.log(
                      'Notification Debug: Published task to manager',
                      {
                        managerId,
                        taskId: task.id,
                        taskTag: task._tag,
                      }
                    )
                  ),
                  Effect.tapError((e) =>
                    Effect.logError(
                      'Error while publishing task to manager',
                      managerId,
                      e
                    )
                  )
                )
              ),
              Effect.allWith({concurrency: 'unbounded', mode: 'either'}),
              // At least one manager must have received the task
              Effect.filterOrFail(
                Array.some(Either.isRight),
                (e) =>
                  new SendMessageTasksManagerError({
                    'cause': Array.filterMap(e, Either.getLeft),
                    'message': 'Failed to emit task to any manager',
                  })
              )
            )

            return Effect.gen(function* (_) {
              yield* _(
                Effect.log(
                  'Notification Debug: Emitting socket task',
                  taskSummary
                )
              )
              yield* _(insertTaskAndEnqueueTimeout)
              yield* _(publishToManagers)
              yield* _(
                Effect.log(
                  'Notification Debug: Socket task emitted successfully',
                  taskSummary
                )
              )
            })
          },
        }
      })
    ).pipe(
      Layer.provideMerge(TimeoutJobsStream.Live),
      Layer.provideMerge(EnqueuePendingTask.Live),
      Layer.provideMerge(TaskProcessorsLive)
    )
}
