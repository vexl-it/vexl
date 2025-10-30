import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Effect,
  Layer,
  MutableHashMap,
  MutableHashSet,
  Option,
} from 'effect/index'
import {RateLimitingService} from '../RateLimiting'

export const mockedRateLimitingLayer = Layer.effect(
  RateLimitingService,
  Effect.gen(function* (_) {
    const whitelistedIps = MutableHashSet.empty<string>()
    const rateLimitState = MutableHashMap.empty<string, number>()

    return {
      clearRateLimitState: Effect.sync(() => {
        MutableHashMap.clear(rateLimitState)
      }),
      incrementAndRateLimitIp: ({ip, route, method, limit}: any) => {
        const key = `${ip}:${route}:${method}`
        const currentCount =
          MutableHashMap.get(rateLimitState, key).pipe(
            Option.getOrElse(() => 0)
          ) + 1

        MutableHashMap.set(rateLimitState, key, currentCount)
        if (currentCount > limit)
          return Effect.succeed({
            allowed: false,
            currentCallCount: currentCount,
            retryAfterMs: 1000,
            rateLimitResetAtMs: unixMillisecondsFromNow(1000),
          })
        return Effect.succeed({
          allowed: true,
          currentCallCount: currentCount,
        })
      },
      isIpWhitelisted: (ip: string) =>
        Effect.succeed(MutableHashSet.has(whitelistedIps, ip)),
      whitelistIp: (ip: string, whitelisted: boolean) =>
        Effect.sync(() => {
          if (whitelisted) MutableHashSet.add(whitelistedIps, ip)
          else MutableHashSet.remove(whitelistedIps, ip)
        }),
    }
  })
)
