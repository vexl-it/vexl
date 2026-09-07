import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer} from 'effect'
import {RedisConnectionService} from '../RedisConnection'
import {serviceNameConfig} from '../commonConfigs'
import {type ConnectingIp} from '../getConnectingIp'
import {
  callRateLimitingCommand,
  ensureRateLimitingCommand,
  type RateLimitResponse,
} from './utils/rateLimitingRedisUtils'

const WHITE_LISTED_IPS_KEY = 'rl:whitelisted_ips'

export interface RateLimitingOperations {
  clearRateLimitState: Effect.Effect<void, UnexpectedServerError>
  incrementAndRateLimitIp: (p: {
    ip: ConnectingIp
    route: string
    method: string
    limit: number
  }) => Effect.Effect<RateLimitResponse, UnexpectedServerError>
  isIpWhitelisted: (
    ip: ConnectingIp
  ) => Effect.Effect<boolean, UnexpectedServerError>
  whitelistIp: (
    ip: ConnectingIp,
    whitelisted: boolean
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class RateLimitingService extends Context.Service<
  RateLimitingService,
  RateLimitingOperations
>()('RateLimitingService') {
  static readonly Live = Layer.effect(
    RateLimitingService,
    Effect.gen(function* () {
      const redis = yield* RedisConnectionService
      const serviceName = yield* serviceNameConfig

      // First ensure rate limiting command
      yield* ensureRateLimitingCommand

      const clearRateLimitState = Effect.gen(function* () {
        let cursor = '0'

        do {
          const [newCursor, keys] = yield* Effect.tryPromise({
            try: async () =>
              await redis.scan(
                cursor,
                'MATCH',
                `${serviceName}:rl:ip:*`,
                'COUNT',
                1000
              ),
            catch: (e) =>
              new UnexpectedServerError({
                cause: e,
                message:
                  'Error while scanning Redis keys for rate limiting cleanup',
              }),
          })
          cursor = newCursor

          yield* Effect.tryPromise({
            try: async () => await redis.del(...keys),
            catch: (e) =>
              new UnexpectedServerError({
                cause: e,
                message:
                  'Error while deleting Redis keys for rate limiting cleanup',
              }),
          })
        } while (cursor !== '0')
      })

      return {
        clearRateLimitState,
        incrementAndRateLimitIp: ({ip, route, method, limit}) =>
          callRateLimitingCommand({
            ip,
            route,
            serviceName,
            method,
            limit,
          }).pipe(Effect.provideService(RedisConnectionService, redis)),
        isIpWhitelisted: (ip: string) =>
          Effect.tryPromise({
            try: async () =>
              (await redis.sismember(WHITE_LISTED_IPS_KEY, ip)) === 1,
            catch: (e) =>
              new UnexpectedServerError({
                cause: e,
                message: 'Error while checking if IP is whitelisted',
              }),
          }),
        whitelistIp: (ip: string, whitelisted: boolean) =>
          Effect.tryPromise({
            try: async () => {
              if (whitelisted) {
                await redis.sadd(WHITE_LISTED_IPS_KEY, ip)
              } else {
                await redis.srem(WHITE_LISTED_IPS_KEY, ip)
              }
            },
            catch: (e) =>
              new UnexpectedServerError({
                cause: e,
                message: 'Error while updating whitelisted IPs',
              }),
          }),
      } satisfies RateLimitingOperations
    })
  )
}
