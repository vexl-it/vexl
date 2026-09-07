import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type Job} from 'bullmq'
import {Effect, Schema, type Config} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {serviceNameConfig} from '../commonConfigs'

export class MetricsMessage extends Schema.Class<MetricsMessage>(
  'MetricsMessage'
)({
  uuid: Uuid,
  name: Schema.String,
  value: Schema.Int.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 1 => 1)),
    Schema.withConstructorDefault(Effect.sync((): 1 => 1))
  ),
  timestamp: Schema.DateFromString.pipe(
    Schema.withDecodingDefaultType(Effect.sync(() => new Date())),
    Schema.withConstructorDefault(Effect.sync(() => new Date()))
  ),
  attributes: Schema.optional(
    Schema.Record(
      Schema.String,
      Schema.Union([Schema.String, Schema.Number, Schema.Boolean])
    )
  ),
  type: Schema.Literals(['Increment', 'Total']).pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 'Increment' => 'Increment')),
    Schema.withConstructorDefault(Effect.sync((): 'Increment' => 'Increment'))
  ),
}) {
  static readonly fromJob = (
    job: Job
  ): Effect.Effect<typeof MetricsMessageWithMetaData.Type, SchemaError> => {
    return Schema.decodeEffect(MetricsMessageWithMetaData)(job.data)
  }

  get jobData(): Effect.Effect<
    typeof MetricsMessageWithMetaData.Encoded,
    SchemaError | Config.ConfigError
  > {
    return serviceNameConfig.pipe(
      Effect.flatMap((serviceName) =>
        Schema.encodeEffect(MetricsMessageWithMetaData)({
          meta: {serviceName},
          message: this,
        })
      )
    )
  }
}

const MetricsMessageMetadata = Schema.Struct({
  serviceName: Schema.String,
})
export const MetricsMessageWithMetaData = Schema.Struct({
  meta: MetricsMessageMetadata,
  message: MetricsMessage,
})

export class ReportingMetricsError extends Schema.TaggedError<ReportingMetricsError>(
  'ReportingMetricsError'
)('ReportingMetricsError', {
  message: Schema.optional(Schema.String),
  cause: Schema.Unknown,
}) {}

export class CreatingMetricsClientError extends Schema.TaggedError<CreatingMetricsClientError>(
  'CreatingMetricsClientError'
)('CreatingMetricsClientError', {
  message: Schema.optional(Schema.String),
  cause: Schema.Unknown,
}) {}
