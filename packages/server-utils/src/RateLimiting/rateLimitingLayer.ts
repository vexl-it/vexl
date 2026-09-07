import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type RateLimitingMiddleware} from '@vexl-next/rest-api/src/rateLimititing'
import {Layer, type Config} from 'effect'
import {type HttpApi, type HttpApiGroup} from 'effect/unstable/httpapi'
import {RateLimitingService} from '.'
import {type RedisConnectionService} from '../RedisConnection'
import {rateLimitingMiddlewareLayer} from './rateLimitngMiddlewareLayer'

export const rateLimitingLayer = <
  Id extends string,
  Groups extends HttpApiGroup.Constraint,
>(
  spec: HttpApi.HttpApi<Id, Groups>
): Layer.Layer<
  RateLimitingMiddleware | RateLimitingService,
  UnexpectedServerError | Config.ConfigError,
  RedisConnectionService
> =>
  rateLimitingMiddlewareLayer(spec).pipe(
    Layer.provideMerge(RateLimitingService.Live)
  )
