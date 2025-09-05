import {UuidE} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type Job} from 'bullmq'
import {type ConfigError, Effect, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {serviceNameConfig} from '../commonConfigs'

export class MetricsMessage extends Schema.Class<MetricsMessage>(
  'MetricsMessage'
)({
  uuid: UuidE,
  name: Schema.String,
  value: Schema.optionalWith(Schema.Int, {default: () => 1}),
  timestamp: Schema.optionalWith(Schema.DateFromString, {
    default: () => new Date(),
  }),
  attributes: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: Schema.Union(Schema.String, Schema.Number, Schema.Boolean),
    })
  ),
  type: Schema.optionalWith(Schema.Literal('Increment', 'Total'), {
    default: () => 'Increment' as const,
  }),
}) {
  static readonly fromJob = (
    job: Job
  ): Effect.Effect<typeof MetricsMessageWithMetaData.Type, ParseError> => {
    return Schema.decode(MetricsMessageWithMetaData)(job.data)
  }

  get jobData(): Effect.Effect<
    typeof MetricsMessageWithMetaData.Encoded,
    ParseError | ConfigError.ConfigError
  > {
    return serviceNameConfig.pipe(
      Effect.flatMap((serviceName) =>
        Schema.encode(MetricsMessageWithMetaData)({
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
