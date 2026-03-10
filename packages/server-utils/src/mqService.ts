import {Queue, Worker, type Job, type JobsOptions} from 'bullmq'
import {
  Context,
  Data,
  Effect,
  flow,
  identity,
  Layer,
  pipe,
  Schema,
  Stream,
  type ParseResult,
} from 'effect/index'
import {RedisConnectionService} from './RedisConnection'
import {RedisNamespacePrefixConfig} from './commonConfigs'

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

  const RedisNamespacePrefixConfigFailWithMqError = Effect.catchTag(
    RedisNamespacePrefixConfig,
    'ConfigError',
    (e) =>
      new MqServiceError({
        message: 'Failed to get Redis namespace prefix from config',
        cause: e,
      })
  )

  const queue = pipe(
    RedisConnectionService,
    Effect.bindTo('redisConnection'),
    Effect.bind('prefix', () => RedisNamespacePrefixConfigFailWithMqError),
    Effect.flatMap(({redisConnection, prefix}) =>
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
            )
          )
      )
    )
  )

  const jobsStream = Stream.asyncScoped<
    unknown,
    MqServiceError,
    RedisConnectionService
  >((emit) =>
    Effect.gen(function* (_) {
      const connection = yield* _(RedisConnectionService)
      const prefix = yield* RedisNamespacePrefixConfigFailWithMqError
      const processJob = async (job: Job<unknown, void>): Promise<void> => {
        await emit.single(job.data)
      }
      yield* _(
        Effect.acquireRelease(
          Effect.try({
            try: () =>
              new Worker(queueName, processJob, {
                connection,
                prefix,
              }),
            catch: (e) =>
              new MqServiceError({
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
        Schema.decodeUnknown(JobPayloadSchema),
        Effect.tapError((e) =>
          Effect.logWarning(
            `${queueName} task worker received invalid job data`
          )
        ),
        Effect.option
      )
    ),
    Stream.filterMap(identity)
  )

  const consumerLayer = <R2>(
    consume: ConsumeJob<A, R2>
  ): Layer.Layer<never, MqServiceError, R | R2 | RedisConnectionService> =>
    Layer.effectDiscard(
      Stream.runForEach(jobsStream, (data) =>
        Effect.withSpan(consume(data), `Consumer/${queueName}`, {
          attributes: {data},
        })
      )
    )

  return {
    EnqueueTask: EnqueueTaskTag,
    producerLayer,
    consumerLayer,
  }
}
