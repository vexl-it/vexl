import {Schema} from 'effect'

export class NotFoundError extends Schema.TaggedError<NotFoundError>(
  'NotFoundError'
)('NotFoundError', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
}) {}

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
  cause: Schema.optional(Schema.Unknown),
  detail: Schema.optional(Schema.String),
}) {}
