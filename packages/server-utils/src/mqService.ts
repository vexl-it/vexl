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

export class MqServiceError extends Data.TaggedError('MqServiceError')<{
  cause: unknown
  message: string
}> {}

type EnqueueTask<A, R> = (
  task: A,
  options?: JobsOptions
) => Effect.Effect<Job, MqServiceError | ParseResult.ParseError, R>

type ConsumeJob<A, E, R> = (
  payload: A
) => Effect.Effect<void, MqServiceError | E, R>

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
  consumerLayer: <E, R2>(
    consume: ConsumeJob<A, E, R2>
  ) => Layer.Layer<never, MqServiceError | E, R2 | R | RedisConnectionService>
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
      const processJob = async (job: Job<unknown, void>): Promise<void> => {
        await emit.single(job.data)
      }
      yield* _(
        Effect.acquireRelease(
          Effect.try({
            try: () =>
              new Worker(queueName, processJob, {
                connection,
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

  const consumerLayer = <E, R2>(
    consume: ConsumeJob<A, E, R2>
  ): Layer.Layer<never, MqServiceError | E, R | R2 | RedisConnectionService> =>
    Layer.effectDiscard(Stream.runForEach(jobsStream, consume))

  return {
    EnqueueTask: EnqueueTaskTag,
    producerLayer,
    consumerLayer,
  }
}
