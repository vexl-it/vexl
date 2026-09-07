import {
  RateLimitedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect'
import {HttpApiMiddleware} from 'effect/unstable/httpapi'

export class RateLimitingMiddleware extends HttpApiMiddleware.Service<RateLimitingMiddleware>()(
  'RateLimitingMiddleware',
  {
    error: Schema.Union([RateLimitedError, UnexpectedServerError]),
  }
) {}
