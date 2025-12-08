import {Effect, Schema} from 'effect'
import {UnixMillisecondsE} from '../utility/UnixMilliseconds.brand'

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

  static wrapErrors = (
    message: string
  ): (<A, I, R>(
    effect: Effect.Effect<A, I, R>
  ) => Effect.Effect<A, UnexpectedServerError, R>) =>
    Effect.catchAll(
      (e) =>
        new UnexpectedServerError({
          cause: e,
          message,
        })
    )
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

export class RateLimitedError extends Schema.TaggedError<RateLimitedError>(
  'RateLimitedError'
)('RateLimitedError', {
  retryAfterMs: Schema.Number,
  rateLimitResetAtMs: UnixMillisecondsE,
  status: Schema.optionalWith(Schema.Literal(429), {default: () => 429}),
}) {}

export class InvalidNextPageTokenError extends Schema.TaggedError<InvalidNextPageTokenError>(
  'InvalidNextPageTokenError'
)('InvalidNextPageTokenError', {
  cause: Schema.Unknown,
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
  message: Schema.optional(Schema.String),
}) {}
