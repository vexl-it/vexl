import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Layer, pipe} from 'effect/index'
import {AnalyticsExpiryWorkerLayer} from './analyticsExpiryWorker'
import {healthServerPortConfig, redisUrl} from './configs'
import DbLayer from './db/layer'
import {MetricsDbService} from './db/MetricsDbService'
import {ApiServerLive} from './httpServer'
import {MetricsConsumerServiceLive} from './metricsConsumer'
import {reportLastReportedMetricsGaugeLive} from './utils/reportLastReportedMetricsGaugeLive'

const MainLive = pipe(
  Layer.empty,
  Layer.provideMerge(
    healthServerLayer({
      port: healthServerPortConfig,
    })
  ),
  Layer.provideMerge(reportLastReportedMetricsGaugeLive),
  Layer.provideMerge(MetricsDbService.Live),
  Layer.provideMerge(RedisService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl)),
  Layer.provideMerge(DbLayer)
)

export const metricsService = Layer.mergeAll(
  ApiServerLive,
  MetricsConsumerServiceLive,
  AnalyticsExpiryWorkerLayer
).pipe(Layer.provide(MainLive))
