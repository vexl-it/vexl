import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, flow, Schema} from 'effect'
import {type ConnectingIp} from '../../getConnectingIp'
import {RedisConnectionService} from '../../RedisConnection'
import {RATE_LIMIT_WINDOW_MS} from '../constants'

export const LUA = `
-- KEYS[1] = zset key, e.g. "rl:ip:{203.0.113.5}"
-- ARGV[1] = now (ms)
-- ARGV[2] = window (ms) e.g. 86400000
-- ARGV[3] = limit (int)
-- ARGV[4] = ttl_s (seconds) key auto-expire (>= window_s)

local key    = KEYS[1]
local now    = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit  = tonumber(ARGV[3])
local ttl_s  = tonumber(ARGV[4])
local oldest = now - window

-- trim old
redis.call('ZREMRANGEBYSCORE', key, 0, oldest)

-- add this hit (unique member so duplicates in same ms are fine)
local member = tostring(now) .. "-" .. tostring(math.random(1000000))
redis.call('ZADD', key, now, member)

-- count after insert
local cnt = redis.call('ZCARD', key)

-- refresh TTL
redis.call('EXPIRE', key, ttl_s)

if cnt <= limit then
  -- allowed
  return {1, cnt, 0, 0}
else
  -- blocked: compute when the window will drop to <= limit
  -- k = how many must expire
  local k = cnt - limit
  local startIdx = k - 1
  local arr = redis.call('ZRANGE', key, startIdx, startIdx, 'WITHSCORES')
  -- arr = {member, score}
  local kth_ts = tonumber(arr[2]) -- milliseconds score
  local resetAt = kth_ts + window
  local retryAfter = resetAt - now
  if retryAfter < 0 then retryAfter = 0 end
  return {0, cnt, retryAfter, resetAt}
end
`
const REDIS_COMMAND_NAME = 'rateLimitIp'

export const ensureRateLimitingCommand: Effect.Effect<
  void,
  never,
  RedisConnectionService
> = RedisConnectionService.pipe(
  Effect.flatMap((redis) =>
    Effect.sync(() => {
      redis.defineCommand(REDIS_COMMAND_NAME, {numberOfKeys: 1, lua: LUA})
    })
  )
)

const redisNow = RedisConnectionService.pipe(
  Effect.flatMap((redis) =>
    Effect.tryPromise({
      try: async () => await redis.time(),
      catch: (e) =>
        new UnexpectedServerError({
          cause: e,
          message: 'Failed to get time from Redis',
        }),
    })
  ),
  Effect.flatMap(
    flow(
      Schema.decodeUnknown(
        Schema.Tuple(Schema.NumberFromString, Schema.NumberFromString)
      ),
      Effect.mapError(
        (e) =>
          new UnexpectedServerError({
            message: 'Failed to decode time from Redis',
            cause: e,
          })
      )
    )
  ),
  Effect.map(([sec, usec]) => sec * 1000 + usec / 1000)
)

const RateLimitResponse = Schema.Union(
  Schema.Struct({
    allowed: Schema.Literal(true),
    currentCallCount: Schema.Number,
  }),
  Schema.Struct({
    allowed: Schema.Literal(false),
    currentCallCount: Schema.Number,
    retryAfterMs: Schema.Number,
    rateLimitResetAtMs: UnixMilliseconds,
  })
)
export type RateLimitResponse = typeof RateLimitResponse.Type

export const callRateLimitingCommand = ({
  ip,
  route,
  serviceName,
  method,
  limit,
}: {
  serviceName: string
  ip: ConnectingIp
  route: string
  method: string
  limit: number
}): Effect.Effect<
  RateLimitResponse,
  UnexpectedServerError,
  RedisConnectionService
> =>
  Effect.gen(function* (_) {
    const redis = yield* _(RedisConnectionService)
    const key = `${serviceName}:rl:ip:${route}:${ip}`
    const now = yield* _(redisNow)
    const windowMs = RATE_LIMIT_WINDOW_MS
    const ttlSeconds = Math.ceil(windowMs / 1000)

    const [allowed, callCount, retryAfterMs, rateLimitResetAtMs] = yield* _(
      Effect.tryPromise({
        try: async () => {
          return await ((await (redis as any)[REDIS_COMMAND_NAME](
            key,
            now,
            windowMs,
            limit,
            ttlSeconds
          )) as Promise<unknown>)
        },
        catch: (e) =>
          new UnexpectedServerError({
            cause: e,
            message: 'Error while calling rate limiting command',
          }),
      }),
      Effect.flatMap((raw) =>
        Schema.decodeUnknown(Schema.Array(Schema.Number))(raw).pipe(
          Effect.catchAll((e) =>
            Effect.zipRight(
              Effect.logError(
                'Got unexpected result from rate limiting Redis command',
                raw
              ),
              new UnexpectedServerError({
                cause: e,
                message:
                  'Got unexpected result from rate limiting Redis command',
              })
            )
          )
        )
      )
    )

    return yield* _(
      Schema.decodeUnknown(RateLimitResponse)(
        allowed === 0
          ? {
              allowed: false,
              currentCallCount: callCount,
              rateLimitResetAtMs,
              retryAfterMs,
            }
          : {
              allowed: true,
              currentCallCount: callCount,
            }
      ),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Failed to return rate limiting response', e),
          new UnexpectedServerError({
            cause: e,
            message:
              'Failed to return rate limiting response. Error while decoding',
          })
        )
      )
    )
  })
