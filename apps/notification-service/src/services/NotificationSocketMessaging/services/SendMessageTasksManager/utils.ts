import {RedisNamespacePrefixConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {validateBullMqJobOptions} from '@vexl-next/server-utils/src/mqService'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {Queue, Worker, type Job, type JobsOptions} from 'bullmq'
import {
  Context,
  Effect,
  Filter,
  flow,
  identity,
  Layer,
  pipe,
  Schema,
  Stream,
} from 'effect'
import {offer} from 'effect/Queue'
import {SendMessageTask} from '../../domain'
import {SendMessageTasksManagerError} from './domain'

const PENDING_TASKS_QUEUE_NAME = 'notification-service_pendingTasksQueue'

const RedisNamespacePrefixConfigFailWithSendMessageTasksManagerError =
  Effect.catchTag(
    RedisNamespacePrefixConfig,
    'ConfigError',
    (e) =>
      new SendMessageTasksManagerError({
        message: 'Failed to get Redis namespace prefix from config',
        cause: e,
      })
  )

const createQueue = pipe(
  RedisConnectionService,
  Effect.bindTo('redisConnection'),
  Effect.bind(
    'prefix',
    () => RedisNamespacePrefixConfigFailWithSendMessageTasksManagerError
  ),
  Effect.flatMap(({redisConnection, prefix}) =>
    Effect.acquireRelease(
      Effect.try({
        try: () =>
          new Queue(PENDING_TASKS_QUEUE_NAME, {
            connection: redisConnection,
            prefix,
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
  ),
  Effect.tap(Effect.log('Pending tasks queue created')),
  Effect.map(
    (queue) => (task: SendMessageTask, options?: JobsOptions) =>
      pipe(
        validateBullMqJobOptions(
          options,
          (forbiddenCharacter) =>
            new SendMessageTasksManagerError({
              cause: {forbiddenCharacter},
              message: `Invalid BullMQ jobId for pending tasks queue: custom job IDs cannot contain "${forbiddenCharacter}"`,
            })
        ),
        Effect.flatMap(() =>
          pipe(
            task,
            Schema.encodeEffect(SendMessageTask),
            SendMessageTasksManagerError.wrapErrors(
              'Error while encoding pending task data'
            )
          )
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

export class EnqueuePendingTask extends Context.Service<
  EnqueuePendingTask,
  (
    task: SendMessageTask,
    options?: JobsOptions
  ) => Effect.Effect<Job, SendMessageTasksManagerError>
>()('EnqueuePendingTask') {
  static Live = Layer.effect(EnqueuePendingTask, createQueue)
}

const createJobStream = Effect.map(RedisConnectionService, (connection) =>
  Stream.callback<
    unknown,
    SendMessageTasksManagerError,
    RedisConnectionService
  >(
    (messages) =>
      Effect.gen(function* () {
        const prefix =
          yield* RedisNamespacePrefixConfigFailWithSendMessageTasksManagerError

        const processJob = async (job: Job<unknown, void>): Promise<void> => {
          await Effect.runPromise(offer(messages, job.data))
        }
        yield* Effect.acquireRelease(
          Effect.try({
            try: () =>
              new Worker(PENDING_TASKS_QUEUE_NAME, processJob, {
                connection,
                prefix,
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
      }),
    {bufferSize: 16}
  ).pipe(
    Stream.mapEffect(
      flow(
        (message: unknown) =>
          Schema.decodeUnknownEffect(SendMessageTask)(message),
        Effect.tapError((e) =>
          Effect.log('Pending task worker received invalid job data')
        ),
        Effect.option
      )
    ),
    Stream.filterMap(Filter.fromPredicateOption(identity))
  )
)

export class TimeoutJobsStream extends Context.Service<
  TimeoutJobsStream,
  Stream.Stream<
    SendMessageTask,
    SendMessageTasksManagerError,
    RedisConnectionService
  >
>()('TimeoutJobsStream') {
  static Live = Layer.effect(TimeoutJobsStream, createJobStream)
}
