import {Schema} from 'effect'

export class NotFoundError extends Schema.TaggedError<NotFoundError>(
  'NotFoundError'
)('NotFoundError', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
  message: Schema.optional(Schema.String),
}) {}

/**
 * @deprecated Use InternalServerError from '@vexl-next/domain' instead
 */
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
  status: Schema.optionalWith(Schema.Literal(500), {default: () => 500}),
  cause: Schema.optional(Schema.Unknown),
  message: Schema.optional(Schema.String),
}) {
  static blindError(): UnexpectedServerError {
    return new UnexpectedServerError({
      cause: new Error('Internal server error'),
      message: 'Internal server error',
    })
  }
}

export class UnauthorizedError extends Schema.TaggedError<UnauthorizedError>(
  'UnauthorizedError'
)('UnauthorizedError', {
  cause: Schema.Unknown,
  status: Schema.Literal(401),
  message: Schema.optionalWith(Schema.String, {
    default: () => 'Unauthorized error',
  }),
}) {}
