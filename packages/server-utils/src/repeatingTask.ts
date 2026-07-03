import {Queue, Worker} from 'bullmq'
import {type Duration, Effect, Layer, Stream} from 'effect'
import {RedisNamespacePrefixConfig} from './commonConfigs'
import {RedisConnectionService} from './RedisConnection'
import {type RedisService, withRedisLock} from './RedisService'

/**
 * Creates a layer that runs `task` every `intervalMs` milliseconds on a BullMQ
 * repeatable job (job scheduler). The schedule lives in Redis, so it fires
 * even across service restarts, and the task itself is guarded by a Redis
 * lock so only one replica executes it per tick (other replicas skip the
 * tick). Task errors are logged and never crash the layer.
 *
 * `queueName` must be dedicated to this single task: BullMQ workers consume
 * every job in a queue regardless of job name, so two repeating tasks sharing
 * a queue would steal each other's ticks.
 */
export const makeRepeatingTaskLayer = <E1, R1, E2, R2>({
  queueName,
  jobName,
  intervalMs,
  lockResource,
  lockDuration,
  task,
}: {
  queueName: string
  jobName: string
  intervalMs: Effect.Effect<number, E1, R1>
  lockResource: string
  lockDuration: Duration.DurationInput
  task: Effect.Effect<void, E2, R2>
}): Layer.Layer<
  never,
  never,
  R1 | R2 | RedisConnectionService | RedisService
> => {
  const jobsStream = Stream.asyncScoped<
    undefined,
    never,
    RedisConnectionService | R1
  >((emit) =>
    Effect.gen(function* (_) {
      const redisConnection = yield* _(RedisConnectionService)
      const prefix = yield* _(RedisNamespacePrefixConfig)
      const interval = yield* _(intervalMs)

      const queue = yield* _(
        Effect.acquireRelease(
          Effect.try({
            try: () =>
              new Queue(queueName, {
                connection: redisConnection,
                prefix,
                defaultJobOptions: {
                  removeOnComplete: true,
                  removeOnFail: true,
                },
              }),
            catch: (e) => e,
          }),
          (queue) =>
            Effect.promise(async () => {
              await queue.close()
            })
        )
      )

      yield* _(
        Effect.tryPromise({
          try: async () =>
            await queue.upsertJobScheduler(
              jobName,
              {every: interval},
              {
                name: jobName,
                data: {},
                opts: {removeOnComplete: true, removeOnFail: true},
              }
            ),
          catch: (e) => e,
        })
      )

      yield* _(
        Effect.acquireRelease(
          Effect.try({
            try: () =>
              new Worker(
                queueName,
                async () => {
                  await emit.single(undefined)
                },
                {
                  connection: redisConnection,
                  prefix,
                  concurrency: 1,
                }
              ),
            catch: (e) => e,
          }),
          (worker) =>
            Effect.promise(async () => {
              await worker.close()
            })
        )
      )
    }).pipe(
      Effect.catchAll((e) =>
        Effect.logError(`Failed to start repeating task ${jobName}`, e)
      )
    )
  )

  const taskWithLock = task.pipe(
    Effect.catchAll((e) =>
      Effect.logError(`Repeating task ${jobName} failed`, e)
    ),
    withRedisLock(lockResource, lockDuration),
    Effect.catchTag('RedisLockError', () =>
      Effect.logInfo(
        `Skipping repeating task ${jobName} because another worker holds the lock`
      )
    ),
    Effect.withSpan(`RepeatingTask/${jobName}`)
  )

  return Layer.effectDiscard(Stream.runForEach(jobsStream, () => taskWithLock))
}
