import {type HttpApi} from '@effect/platform/index'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type RateLimitingMiddleware} from '@vexl-next/rest-api/src/rateLimititing'
import {type ConfigError, Layer} from 'effect/index'
import {RateLimitingService} from '.'
import {type RedisConnectionService} from '../RedisConnection'
import {rateLimitingMiddlewareLayer} from './rateLimitngMiddlewareLayer'

export const rateLimitingLayer = (
  spec: HttpApi.HttpApi<any, any, any, any>
): Layer.Layer<
  RateLimitingMiddleware | RateLimitingService,
  UnexpectedServerError | ConfigError.ConfigError,
  RedisConnectionService
> =>
  rateLimitingMiddlewareLayer(spec).pipe(
    Layer.provideMerge(RateLimitingService.Live)
  )
