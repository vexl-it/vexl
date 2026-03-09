import {Queue, Worker, type Job, type JobsOptions} from 'bullmq'
import {
  Context,
  Data,
  Effect,
  Layer,
  pipe,
  Runtime,
  Schema,
  type ParseResult,
} from 'effect/index'
import {RedisConnectionService} from './RedisConnection'

export class MqServiceError extends Data.TaggedError('MqServiceError')<{
  cause: unknown
  message: string
}> {}

type EnqueueTask<A, R> = (
  task: A,
  options?: JobsOptions
) => Effect.Effect<Job, MqServiceError | ParseResult.ParseError, R>

type ConsumeJob<A, R> = (payload: A) => Effect.Effect<void, never, R>

export const makeMqService = <A, I, R, TAG extends string>(
  queueName: TAG,
  JobPayloadSchema: Schema.Schema<A, I, R>
): {
  EnqueueTask: Context.Tag<`mqService/${TAG}`, EnqueueTask<A, R>>
  producerLayer: Layer.Layer<
    `mqService/${TAG}`,
    MqServiceError,
    RedisConnectionService
  >
  consumerLayer: <R2>(
    consume: ConsumeJob<A, R2>
  ) => Layer.Layer<never, MqServiceError, R2 | R | RedisConnectionService>
} => {
  const tag = `mqService/${queueName}` as const

  const queue = pipe(
    RedisConnectionService,
    Effect.flatMap((redisConnection) =>
      Effect.acquireRelease(
        Effect.try({
          try: () =>
            new Queue(queueName, {
              connection: redisConnection,
              defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
              },
            }),
          catch: (e) =>
            new MqServiceError({
              message: `Error while creating ${queueName} queue`,
              cause: e,
            }),
        }),
        (queue) =>
          Effect.zip(
            Effect.log(`Closing ${queueName} queue`),
            Effect.promise(async () => {
              await queue.close()
            })
          )
      )
    )
  )

  const EnqueueTaskTag = Context.GenericTag<typeof tag, EnqueueTask<A, R>>(tag)

  const producerLayer = Layer.scoped(
    EnqueueTaskTag,
    pipe(
      queue,
      Effect.map(
        (queue) => (task: A, options?: JobsOptions) =>
          pipe(
            task,
            Schema.encode(JobPayloadSchema),
            Effect.flatMap((data) =>
              Effect.tryPromise({
                try: async () => await queue.add(queueName, data, options),
                catch: (e) =>
                  new MqServiceError({
                    cause: e,
                    message: `Failed to add job to ${queueName} queue`,
                  }),
              })
            ),
            Effect.withSpan(`Producer/${queueName}`, {
              attributes: {task, options},
            })
          )
      )
    )
  )

  const consumerLayer = <R2>(
    consume: ConsumeJob<A, R2>
  ): Layer.Layer<never, MqServiceError, R | R2 | RedisConnectionService> =>
    Layer.scopedDiscard(
      Effect.gen(function* (_) {
        const connection = yield* _(RedisConnectionService)
        const runtime = yield* _(Effect.runtime<R | R2>())
        const runFork = Runtime.runFork(runtime)

        yield* _(
          Effect.log(
            `[${queueName}]: Creating worker. Redis status: ${connection.status}`
          )
        )

        const processJob = async (job: Job<unknown, void>): Promise<void> => {
          console.log(
            `[${queueName}]: processJob start`,
            JSON.stringify({
              jobId: job.id,
              name: job.name,
              attemptsMade: job.attemptsMade,
              delay: job.delay,
              timestamp: job.timestamp,
              data: job.data,
            })
          )

          const effect = pipe(
            job.data,
            Schema.decodeUnknown(JobPayloadSchema),
            Effect.tap((data) =>
              Effect.log(`[${queueName}]: Job payload decoded`, {
                jobId: job.id,
                data,
              })
            ),
            Effect.tapError(() =>
              Effect.logWarning(
                `[${queueName}]: Worker received invalid job data`
              )
            ),
            Effect.flatMap((data) =>
              Effect.withSpan(consume(data), `Consumer/${queueName}`, {
                attributes: {data},
              })
            ),
            Effect.catchAllDefect((defect) =>
              Effect.logError(
                `[${queueName}]: Defect in consume callback`,
                defect
              )
            )
          )

          const fiber = runFork(effect)
          const exit = await Effect.runPromise(fiber.await)

          if (exit._tag === 'Failure') {
            await Effect.runPromise(
              Effect.logError(
                `[${queueName}]: Job processing failed`,
                exit.cause
              )
            )
          } else {
            await Effect.runPromise(
              Effect.log(`[${queueName}]: Job processing finished`, {
                jobId: job.id,
              })
            )
          }
        }

        yield* _(
          Effect.acquireRelease(
            Effect.try({
              try: () => {
                const worker = new Worker(queueName, processJob, {
                  connection,
                })
                worker.on('ready', () => {
                  console.log(`[${queueName}]: Worker ready`)
                })
                worker.on('error', (err) => {
                  console.error(`[${queueName}]: Worker error:`, err)
                })
                worker.on('stalled', (jobId) => {
                  console.warn(`[${queueName}]: Job stalled: ${jobId}`)
                })
                return worker
              },
              catch: (e) =>
                new MqServiceError({
                  cause: e,
                  message: `Failed to create ${queueName} worker`,
                }),
            }),
            (worker) =>
              Effect.zip(
                Effect.log(`[${queueName}]: Closing worker`),
                Effect.promise(async () => {
                  await worker.close()
                })
              )
          )
        )

        yield* _(Effect.log(`[${queueName}]: Worker created and registered`))
      })
    )

  return {
    EnqueueTask: EnqueueTaskTag,
    producerLayer,
    consumerLayer,
  }
}
