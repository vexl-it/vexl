import {NodeContext} from '@effect/platform-node/index'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {Effect, Layer, pipe} from 'effect/index'
import {healthServerPortConfig, redisUrl} from './configs'
import DbLayer from './db/layer'
import {MetricsDbService} from './db/MetricsDbService'
import {httpServerEffect} from './httpServer'
import {metricsConsumerServiceEffect} from './metricsConsumer'

const MainLive = pipe(
  Layer.empty,
  Layer.provideMerge(
    healthServerLayer({
      port: healthServerPortConfig,
    })
  ),
  Layer.provideMerge(MetricsDbService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl)),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(NodeContext.layer)
)

export const metricsService = Effect.all(
  [httpServerEffect, metricsConsumerServiceEffect],
  {concurrency: 'unbounded'}
).pipe(Effect.provide(MainLive))
