import {
  RateLimitedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {RateLimitingMiddleware} from '@vexl-next/rest-api/src/rateLimititing'
import {Effect, Layer, pipe, type Config} from 'effect'
import {HttpServerRequest} from 'effect/unstable/http'
import {type HttpApi, type HttpApiGroup} from 'effect/unstable/httpapi'
import {RateLimitingService} from '.'
import {
  enableRateLimitingInDevelopmentConfig,
  isRunningInProductionConfig,
  rateLimitPerIpMultiplierConfig,
} from '../commonConfigs'
import {getConnectingIp} from '../getConnectingIp'
import {makeMiddlewareEffect} from '../makeMiddlewareEffect'
import {reportRateLimit} from './metrics'
import {buildRateLimitingLimitsForEndpoints, normalizePath} from './utils'

export const rateLimitingMiddlewareLayer = <
  Id extends string,
  Groups extends HttpApiGroup.Constraint,
>(
  spec: HttpApi.HttpApi<Id, Groups>
): Layer.Layer<
  RateLimitingMiddleware,
  UnexpectedServerError | Config.ConfigError,
  RateLimitingService
> =>
  Layer.effect(
    RateLimitingMiddleware,
    Effect.gen(function* () {
      const disableRateLimitingInDev = yield* pipe(
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
        yield* Effect.logInfo('Rate limiting is disabled in development mode')
        return (httpEffect) => httpEffect
      }

      const {getEndpointLimit} = buildRateLimitingLimitsForEndpoints(
        spec,
        yield* rateLimitPerIpMultiplierConfig
      )
      const rateLimiting = yield* RateLimitingService

      return (httpEffect) =>
        Effect.gen(function* () {
          const connectingIp = yield* pipe(
            getConnectingIp,
            Effect.flatMap(Effect.fromOption),
            Effect.mapError(
              () =>
                new UnexpectedServerError({
                  message:
                    'Could not determine connecting IP for rate limiting',
                })
            )
          )

          if (yield* rateLimiting.isIpWhitelisted(connectingIp)) {
            return
          }

          const request = yield* HttpServerRequest.HttpServerRequest
          const route = normalizePath(request.url)
          const endpointLimit = getEndpointLimit(request.method, route)

          // This means that the endpoint is not defined in the API spec. Let it pass to return 404 (or docs)
          if (endpointLimit._tag === 'noRouteFound') {
            yield* Effect.logInfo('No rate limiting route found for endpoint', {
              route,
              method: request.method,
            })
            return
          }

          // If the limit is defined in API spec as "no limit specified", we treat it as an error.
          if (endpointLimit._tag === 'noLimitSpecified') {
            yield* Effect.fail(
              new UnexpectedServerError({
                message: `Could not determine rate limit for endpoint ${request.method} ${route}`,
              })
            )
            return
          }

          const limit = endpointLimit.limit

          yield* Effect.log('Rate limiting check', {
            ip: connectingIp,
            route,
            method: request.method,
            limit,
          })

          const rateLimitResult = yield* rateLimiting.incrementAndRateLimitIp({
            ip: connectingIp,
            route,
            method: request.method,
            limit,
          })

          yield* reportRateLimit({
            allowed: rateLimitResult.allowed,
            method: request.method,
            route,
            limit,
          })

          if (!rateLimitResult.allowed) {
            yield* Effect.logInfo('Rate limiting ip', {
              ip: connectingIp,
              route,
              method: request.method,
            })

            yield* new RateLimitedError({
              rateLimitResetAtMs: rateLimitResult.rateLimitResetAtMs,
              retryAfterMs: rateLimitResult.retryAfterMs,
            })
          }
        }).pipe(
          makeMiddlewareEffect(RateLimitedError),
          Effect.withSpan('RateLimitingMiddleware'),
          Effect.andThen(httpEffect)
        )
    })
  )
