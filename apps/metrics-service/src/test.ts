import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {reportMetricForked} from '@vexl-next/server-utils/src/metrics/reportMetricForked'
import {runMainInNode} from '@vexl-next/server-utils/src/runMainInNode'
import {Effect, Layer, pipe} from 'effect'
import {redisUrl} from './configs'

const main = pipe(
  Effect.void,
  Effect.flatMap(() => {
    const uuid = generateUuid()

    return Effect.all([
      reportMetricForked(
        new MetricsMessage({
          uuid,
          timestamp: new Date(),
          name: 'Test metric',
          attributes: {key: 'value'},
        })
      ),
      reportMetricForked(
        new MetricsMessage({
          uuid: generateUuid(),
          timestamp: new Date(),
          name: 'Test metric2',
        })
      ),
    ])
  }),
  Effect.flatMap(() => Effect.sleep(1_000)),
  Effect.forever,
  Effect.provide(
    Layer.empty.pipe(
      Layer.provideMerge(MetricsClientService.Live),
      Layer.provideMerge(RedisConnectionService.layer(redisUrl))
    )
  )
)

runMainInNode(main)
