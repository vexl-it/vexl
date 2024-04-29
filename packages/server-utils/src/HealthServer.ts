import {NodeHttpServer} from '@effect/platform-node'
import * as Http from '@effect/platform/HttpServer'
import {Effect, Layer} from 'effect'

import {createServer} from 'http'

export function makeHealthServerLive({
  port,
}: {
  port: number
}): Layer.Layer<never, Http.error.ServeError, never> {
  const HealtServerLive = NodeHttpServer.server.layer(() => createServer(), {
    port,
  })

  const HealthHttpLive = Http.router.empty.pipe(
    Http.router.get(
      '*',
      Effect.succeed(Http.response.text('ok', {status: 200}))
    )
  )

  const HealthAppLive = HealthHttpLive.pipe(
    Http.server.serve(),
    Layer.provide(HealtServerLive),
    Layer.provide(
      Layer.effectDiscard(Effect.log(`Health server running on port ${port}`))
    )
  )

  return HealthAppLive
}
