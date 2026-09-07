import {Effect, Schema} from 'effect'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'

export class NotFoundError extends Schema.TaggedError<NotFoundError>(
  'NotFoundError'
)('NotFoundError', {
  status: Schema.Literal(404).pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 404 => 404)),
    Schema.withConstructorDefault(Effect.sync((): 404 => 404))
  ),
  message: Schema.optional(Schema.String),
}) {}

/**
 * @deprecated Use InternalServerError from '@vexl-next/domain' instead
 */
export class InternalServerError extends Schema.TaggedError<InternalServerError>(
  'InternalServerError'
)('InternalServerError', {
  cause: Schema.Literals(['ExternalApi', 'Unknown', 'BodyError']).pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 'Unknown' => 'Unknown')),
    Schema.withConstructorDefault(Effect.sync((): 'Unknown' => 'Unknown'))
  ),
}) {}

export class UnexpectedServerError extends Schema.TaggedError<UnexpectedServerError>(
  'UnexpectedServerError'
)('UnexpectedServerError', {
  status: Schema.Literal(500).pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 500 => 500)),
    Schema.withConstructorDefault(Effect.sync((): 500 => 500))
  ),
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
    Effect.catch(
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
  message: Schema.String.pipe(
    Schema.withDecodingDefaultType(
      Effect.sync((): 'Unauthorized error' => 'Unauthorized error')
    ),
    Schema.withConstructorDefault(
      Effect.sync((): 'Unauthorized error' => 'Unauthorized error')
    )
  ),
}) {}

export class RateLimitedError extends Schema.TaggedError<RateLimitedError>(
  'RateLimitedError'
)('RateLimitedError', {
  retryAfterMs: Schema.Number,
  rateLimitResetAtMs: UnixMilliseconds,
  status: Schema.Literal(429).pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 429 => 429)),
    Schema.withConstructorDefault(Effect.sync((): 429 => 429))
  ),
}) {}

export class InvalidNextPageTokenError extends Schema.TaggedError<InvalidNextPageTokenError>(
  'InvalidNextPageTokenError'
)('InvalidNextPageTokenError', {
  cause: Schema.Unknown,
  status: Schema.Literal(400).pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 400 => 400)),
    Schema.withConstructorDefault(Effect.sync((): 400 => 400))
  ),
  message: Schema.optional(Schema.String),
}) {}
