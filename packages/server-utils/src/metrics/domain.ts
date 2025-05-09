import {UuidE} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type Job} from 'bullmq'
import {Schema, type Effect} from 'effect'
import {type ParseError} from 'effect/ParseResult'

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
  private static readonly encode = Schema.encode(MetricsMessage)
  private static readonly decodeUnknwon = Schema.decodeUnknown(MetricsMessage)

  static readonly fromJob = (
    job: Job
  ): Effect.Effect<MetricsMessage, ParseError> => {
    return MetricsMessage.decodeUnknwon(job.data)
  }

  get jobData(): Effect.Effect<typeof MetricsMessage.Encoded, ParseError> {
    return MetricsMessage.encode(this)
  }
}
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
