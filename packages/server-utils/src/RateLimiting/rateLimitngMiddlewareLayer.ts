import {HttpServerRequest, type HttpApi} from '@effect/platform/index'
import {
  RateLimitedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {RateLimitingMiddleware} from '@vexl-next/rest-api/src/rateLimititing'
import {Effect, Layer, type ConfigError} from 'effect/index'
import {RateLimitingService} from '.'
import {
  enableRateLimitingInDevelopmentConfig,
  isRunningInProductionConfig,
  rateLimitPerIpMultiplierConfig,
} from '../commonConfigs'
import {getConnectingIp} from '../getConnectingIp'
import {makeMiddlewareEffect} from '../makeMiddlewareEffect'
import {reportRateLimit} from './metrics'
import {buildRateLimitingLimitsForEndpoints} from './utils'

export const rateLimitingMiddlewareLayer = (
  spec: HttpApi.HttpApi<any, any, any, any>
): Layer.Layer<
  RateLimitingMiddleware,
  UnexpectedServerError | ConfigError.ConfigError,
  RateLimitingService
> =>
  Layer.effect(
    RateLimitingMiddleware,
    Effect.gen(function* (_) {
      const disableRateLimitingInDev = yield* _(
        Effect.all([
          isRunningInProductionConfig,
          enableRateLimitingInDevelopmentConfig,
        ]),
        Effect.map(
          ([isRunningInProd, enableRLInDev]) =>
            !isRunningInProd && !enableRLInDev
        )
      )

      if (disableRateLimitingInDev) {
        yield* _(
          Effect.logInfo('Rate limiting is disabled in development mode')
        )
        return Effect.void
      }

      const {getEndpointLimit} = buildRateLimitingLimitsForEndpoints(
        spec,
        yield* _(rateLimitPerIpMultiplierConfig)
      )
      const rateLimiting = yield* _(RateLimitingService)

      return Effect.gen(function* (_) {
        const connectingIp = yield* _(
          getConnectingIp,
          Effect.flatten,
          Effect.mapError(
            () =>
              new UnexpectedServerError({
                message: 'Could not determine connecting IP for rate limiting',
              })
          )
        )

        if (yield* _(rateLimiting.isIpWhitelisted(connectingIp))) {
          return
        }

        const request = yield* _(HttpServerRequest.HttpServerRequest)
        const endpointLimit = getEndpointLimit(request.method, request.url)

        // This means that the endpoint is not defined in the API spec. Let it pass to return 404 (or docs)
        if (endpointLimit._tag === 'noRouteFound') {
          yield* _(
            Effect.logInfo('No rate limiting route found for endpoint', {
              route: request.url,
              method: request.method,
            })
          )
          return
        }

        // If the limit is defined in API spec as "no limit specified", we treat it as an error.
        if (endpointLimit._tag === 'noLimitSpecified') {
          yield* _(
            Effect.fail(
              new UnexpectedServerError({
                message: `Could not determine rate limit for endpoint ${request.method} ${request.url}`,
              })
            )
          )
          return
        }

        const limit = endpointLimit.limit

        yield* _(
          Effect.log('Rate limiting check', {
            ip: connectingIp,
            route: request.url,
            method: request.method,
            limit,
          })
        )

        const rateLimitResult = yield* _(
          rateLimiting.incrementAndRateLimitIp({
            ip: connectingIp,
            route: request.url,
            method: request.method,
            limit,
          })
        )

        yield* _(
          reportRateLimit({
            allowed: rateLimitResult.allowed,
            method: request.method,
            route: request.url,
            limit,
          })
        )

        if (!rateLimitResult.allowed) {
          yield* _(
            Effect.logInfo('Rate limiting ip', {
              ip: connectingIp,
              route: request.url,
              method: request.method,
            })
          )

          yield* _(
            new RateLimitedError({
              rateLimitResetAtMs: rateLimitResult.rateLimitResetAtMs,
              retryAfterMs: rateLimitResult.retryAfterMs,
            })
          )
        }
      }).pipe(
        makeMiddlewareEffect(RateLimitedError),
        Effect.withSpan('RateLimitingMiddleware')
      )
    })
  )
