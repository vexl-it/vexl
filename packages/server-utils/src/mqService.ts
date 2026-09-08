import {Queue, Worker, type Job, type JobsOptions} from 'bullmq'
import {
  Context,
  Data,
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
import {RedisConnectionService} from './RedisConnection'
import {RedisNamespacePrefixConfig} from './commonConfigs'

export class MqServiceError extends Data.TaggedError('MqServiceError')<{
  cause: unknown
  message: string
}> {}

const BULLMQ_JOB_ID_FORBIDDEN_CHARACTER = ':'

export const validateBullMqJobOptions = <E>(
  options: JobsOptions | undefined,
  onInvalidJobId: (forbiddenCharacter: string) => E
): Effect.Effect<void, E> => {
  if (options?.jobId?.includes(BULLMQ_JOB_ID_FORBIDDEN_CHARACTER)) {
    return Effect.fail(onInvalidJobId(BULLMQ_JOB_ID_FORBIDDEN_CHARACTER))
  }

  return Effect.void
}

export type EnqueueTask<A, R> = (
  task: A,
  options?: JobsOptions
) => Effect.Effect<Job, MqServiceError | Schema.SchemaError, R>

type ConsumeJob<A, R> = (payload: A) => Effect.Effect<void, never, R>

export type MqProducerContext<
  MqService extends {EnqueueTask: Context.Key<unknown, unknown>},
> = Context.Service.Identifier<MqService['EnqueueTask']>

export type MqProducerService<
  MqService extends {EnqueueTask: Context.Key<unknown, unknown>},
> = Context.Service.Shape<MqService['EnqueueTask']>

export const makeMqService = <A, I, R, TAG extends string>(
  queueName: TAG,
  JobPayloadSchema: Schema.Codec<A, I, R, R>
): {
  EnqueueTask: Context.Service<`mqService/${TAG}`, EnqueueTask<A, R>>
  EnqueueTaskContext: `mqService/${TAG}`
  producerLayer: Layer.Layer<
    `mqService/${TAG}`,
    MqServiceError,
    RedisConnectionService
  >
  consumerLayer: <R2>(
    consume: ConsumeJob<A, R2>
  ) => Layer.Layer<never, MqServiceError, R2 | R | RedisConnectionService>
} => {
  const tag: `mqService/${TAG}` = `mqService/${queueName}`

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

  const EnqueueTaskTag = Context.Service<typeof tag, EnqueueTask<A, R>>(tag)

  const producerLayer = Layer.effect(
    EnqueueTaskTag,
    pipe(
      queue,
      Effect.map(
        (queue) => (task: A, options?: JobsOptions) =>
          pipe(
            validateBullMqJobOptions(
              options,
              (forbiddenCharacter) =>
                new MqServiceError({
                  cause: {forbiddenCharacter},
                  message: `Invalid BullMQ jobId for ${queueName} queue: custom job IDs cannot contain "${forbiddenCharacter}"`,
                })
            ),
            Effect.flatMap(() =>
              pipe(task, Schema.encodeEffect(JobPayloadSchema))
            ),
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

  const jobsStream = Stream.callback<
    unknown,
    MqServiceError,
    RedisConnectionService
  >(
    (messages) =>
      Effect.gen(function* () {
        const connection = yield* RedisConnectionService
        const prefix = yield* RedisNamespacePrefixConfigFailWithMqError
        const processJob = async (job: Job<unknown, void>): Promise<void> => {
          await Effect.runPromise(offer(messages, job.data))
        }
        yield* Effect.acquireRelease(
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
      }),
    {bufferSize: 16}
  ).pipe(
    Stream.mapEffect(
      flow(
        (message: unknown) =>
          Schema.decodeUnknownEffect(JobPayloadSchema)(message),
        Effect.tapError((e) =>
          Effect.logWarning(
            `${queueName} task worker received invalid job data`
          )
        ),
        Effect.option
      )
    ),
    Stream.filterMap(Filter.fromPredicateOption(identity))
  )

  const consumerLayer = <R2>(
    consume: ConsumeJob<A, R2>
  ): Layer.Layer<never, MqServiceError, R | R2 | RedisConnectionService> =>
    Layer.effectDiscard(
      Stream.runForEach(jobsStream, (data) =>
        Effect.withSpan(consume(data), `Consumer/${queueName}`)
      )
    )

  return {
    EnqueueTask: EnqueueTaskTag,
    EnqueueTaskContext: tag,
    producerLayer,
    consumerLayer,
  }
}
