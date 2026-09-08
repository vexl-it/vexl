import {type Effect, Metric} from 'effect'

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
  (allowed ? RateLimitRequestAllowed : RateLimitRequestLimited).pipe(
    Metric.withAttributes({method, route, limit: String(limit)}),
    Metric.update(1)
  )
