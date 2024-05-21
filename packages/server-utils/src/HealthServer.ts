import {NodeHttpServer} from '@effect/platform-node'
import * as Http from '@effect/platform/HttpServer'
import {Effect, Layer} from 'effect'

import {createServer} from 'http'

export function makeHealthServerLive({
  port,
}: {
  port: number
}): Layer.Layer<never, Http.error.ServeError, never> {
  const HealtServerLive = NodeHttpServer.server.layer(
    () => {
      const server = createServer()
      server.on('error', (e) => {
        console.error('Health server error', e)
      })
      server.on('close', () => {
        console.log('Health server closed')
      })
      return server
    },
    {
      port,
    }
  )

  const HealthHttpLive = Http.router.empty.pipe(
    Http.router.get(
      '*',
      Effect.succeed(Http.response.text('ok', {status: 200}))
    )
  )

  const HealthAppLive = HealthHttpLive.pipe(
    Http.server.serve((a) =>
      Http.middleware.logger(a).pipe(Effect.withLogSpan('health server'))
    ),
    Layer.provide(HealtServerLive),
    Layer.provide(
      Layer.effectDiscard(Effect.log(`Health server running on port ${port}`))
    )
  )

  return HealthAppLive
}
