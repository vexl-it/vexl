import {Schema} from '@effect/schema'
import {type ParseError} from '@effect/schema/ParseResult'
import {UuidE} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Effect} from 'effect'
import {type IMessageTransferable, ProducibleMessage} from 'redis-smq'

export const METRICS_QUEUE_NAME = 'metrics' as const

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

  static readonly fromTransferferableMessage = (
    message: IMessageTransferable
  ): Effect.Effect<MetricsMessage, ParseError> => {
    return MetricsMessage.decodeUnknwon(message.body)
  }

  toProducibleMessage(): Effect.Effect<ProducibleMessage, ParseError> {
    return MetricsMessage.encode(this).pipe(
      Effect.flatMap((encodedBody) =>
        Effect.sync(() => {
          const message = new ProducibleMessage()
          message.setBody(encodedBody).setQueue(METRICS_QUEUE_NAME)
          return message
        })
      )
    )
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
