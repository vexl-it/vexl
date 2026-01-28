import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {Queue as BullQueue, type Job, type JobsOptions, Worker} from 'bullmq'
import {
  Context,
  Effect,
  flow,
  identity,
  Layer,
  pipe,
  Schema,
  Stream,
} from 'effect/index'
import {SendMessageTask} from '../../domain'
import {SendMessageTasksManagerError} from './domain'

const PENDING_TASKS_QUEUE_NAME = 'notification-service_pendingTasksQueue'

const createQueue = Effect.flatMap(RedisConnectionService, (redisConnection) =>
  Effect.acquireRelease(
    Effect.try({
      try: () =>
        new BullQueue(PENDING_TASKS_QUEUE_NAME, {
          connection: redisConnection,
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: true,
          },
        }),
      catch: (e) =>
        new SendMessageTasksManagerError({
          cause: e,
          message: 'Failed to create pending tasks queue',
        }),
    }),
    (queue) =>
      Effect.zip(
        Effect.log('Closing pending tasks queue'),
        Effect.promise(async () => {
          await queue.close()
        })
      )
  )
).pipe(
  Effect.zipLeft(Effect.log('Pending tasks queue created')),
  Effect.map(
    (queue) => (task: SendMessageTask, options?: JobsOptions) =>
      pipe(
        task,
        Schema.encode(SendMessageTask),
        SendMessageTasksManagerError.wrapErrors(
          'Error while encoding pending task data'
        ),
        Effect.flatMap((data) =>
          Effect.tryPromise({
            try: async () => await queue.add(task.id, data, options),
            catch: (e) =>
              new SendMessageTasksManagerError({
                cause: e,
                message: 'Failed to add job to pending tasks queue',
              }),
          })
        )
      )
  )
)

export class EnqueuePendingTask extends Context.Tag('EnqueuePendingTask')<
  EnqueuePendingTask,
  (
    task: SendMessageTask,
    options?: JobsOptions
  ) => Effect.Effect<Job, SendMessageTasksManagerError>
>() {
  static Live = Layer.scoped(EnqueuePendingTask, createQueue)
}

const createJobStream = Effect.map(RedisConnectionService, (connection) =>
  Stream.asyncScoped<
    unknown,
    SendMessageTasksManagerError,
    RedisConnectionService
  >((emit) =>
    Effect.gen(function* (_) {
      const processJob = async (job: Job<unknown, void>): Promise<void> => {
        await emit.single(job.data)
      }
      yield* _(
        Effect.acquireRelease(
          Effect.try({
            try: () =>
              new Worker(PENDING_TASKS_QUEUE_NAME, processJob, {
                connection,
              }),
            catch: (e) =>
              new SendMessageTasksManagerError({
                cause: e,
                message: 'Failed to create pending tasks worker',
              }),
          }),
          (worker) =>
            Effect.promise(async () => {
              await worker.close()
            })
        )
      )
    })
  ).pipe(
    Stream.mapEffect(
      flow(
        Schema.decodeUnknown(SendMessageTask),
        Effect.tapError((e) =>
          Effect.log('Pending task worker received invalid job data')
        ),
        Effect.option
      )
    ),
    Stream.filterMap(identity)
  )
)

export class TimeoutJobsStream extends Context.Tag('TimeoutJobsStream')<
  TimeoutJobsStream,
  Stream.Stream<
    SendMessageTask,
    SendMessageTasksManagerError,
    RedisConnectionService
  >
>() {
  static Live = Layer.effect(TimeoutJobsStream, createJobStream)
}
