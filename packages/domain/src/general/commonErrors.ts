import {Schema} from '@effect/schema'

export class NotFoundError extends Schema.TaggedError<NotFoundError>(
  'NotFoundError'
)('NotFoundError', {}) {}

export class InternalServerError extends Schema.TaggedError<InternalServerError>(
  'InternalServerError'
)('InternalServerError', {
  cause: Schema.Literal('ExternalApi', 'Unknown', 'BodyError').pipe(
    Schema.optionalWith({default: () => 'Unknown' as const})
  ),
}) {}

export class UnexpectedServerError extends Schema.TaggedError<UnexpectedServerError>(
  'UnexpectedServerError'
)('UnexpectedServerError', {
  status: Schema.Literal(500),
  detail: Schema.optional(Schema.String),
}) {}
