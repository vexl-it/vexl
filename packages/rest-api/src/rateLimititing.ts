import {HttpApiMiddleware} from '@effect/platform/index'
import {
  RateLimitedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect/index'

export class RateLimitingMiddleware extends HttpApiMiddleware.Tag<RateLimitingMiddleware>()(
  'RateLimitingMiddleware',
  {
    optional: false,
    failure: Schema.Union(RateLimitedError, UnexpectedServerError),
  }
) {}
