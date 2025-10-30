import {Effect, Metric} from 'effect/index'

export const RateLimitRequestAllowed = Metric.counter(
  'rate_limit_request_allowed_total'
)
export const RateLimitRequestLimited = Metric.counter(
  'rate_limit_request_limited_total'
)

export const reportRateLimit = ({
  allowed,
  method,
  route,
  limit,
}: {
  allowed: boolean
  method: string
  route: string
  limit: number
}): Effect.Effect<void> =>
  (allowed ? RateLimitRequestAllowed : RateLimitRequestLimited)(
    Effect.succeed(1)
  ).pipe(
    Effect.tagMetrics('method', method),
    Effect.tagMetrics('route', route),
    Effect.tagMetrics('limit', String(limit))
  )
