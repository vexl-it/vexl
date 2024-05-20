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
      server.on('close', () => {
        console.log('Closing health server!')
      })
      server.on('error', (error) => {
        console.error('Health server error:', error)
      })
      return server
    },
    {
      port,
    }
  )

  const HealthHttpLive = Http.router.empty
    .pipe(
      Http.router.get(
        '*',
        Effect.succeed(Http.response.text('ok', {status: 200}))
      )
    )
    .pipe(Http.middleware.logger)

  const HealthAppLive = HealthHttpLive.pipe(
    Http.server.serve(),
    Layer.provide(HealtServerLive),
    Layer.provide(
      Layer.effectDiscard(Effect.log(`Health server running on port ${port}`))
    )
  )

  return HealthAppLive
}
