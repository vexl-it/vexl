import {
  HttpRouter,
  HttpServer,
  HttpServerResponse,
  type HttpServerError,
} from '@effect/platform'
import {NodeHttpServer} from '@effect/platform-node'
import {PgClient} from '@effect/sql-pg'
import {Config, Effect, Layer, Option} from 'effect'
import {type ConfigError} from 'effect/ConfigError'
import {createServer} from 'http'
import {RedisConnectionService} from './RedisConnection'

export type ReadinessCheckEffect<C = never> = Effect.Effect<boolean, never, C>

export const isReadisConnectionReady: ReadinessCheckEffect<RedisConnectionService> =
  RedisConnectionService.pipe(
    Effect.flatMap((redis) =>
      Effect.zipRight(
        Effect.log('Checking redis status', redis.status),
        Effect.sync(() => redis.status === 'ready')
      )
    ),
    Effect.catchAllCause((c) =>
      Effect.zipRight(
        Effect.log('Error while checking redis connection status', c),
        Effect.succeed(false)
      )
    )
  )

export const isDatbaseConnectionReady: ReadinessCheckEffect<PgClient.PgClient> =
  PgClient.PgClient.pipe(
    Effect.flatMap(
      (sql) => sql`
        SELECT
          1 AS "one"
      `
    ),
    Effect.flatMap((rows) =>
      Effect.zipRight(
        Effect.log('Checking database status', {
          rows,
          success: rows[0]?.one === 1,
        }),
        Effect.sync(() => rows[0]?.one === 1)
      )
    ),
    Effect.catchAllCause((c) =>
      Effect.zipRight(
        Effect.log('Error while checking database connection status', c),
        Effect.succeed(false)
      )
    )
  )

export const composeReadinessChecks =
  <C1, C2>(self: ReadinessCheckEffect<C1>) =>
  (check: ReadinessCheckEffect<C2>): ReadinessCheckEffect<C1 | C2> =>
    Effect.zip(self, check).pipe(Effect.map(([one, two]) => one && two))

// this is too complicated for what it does. I know ...
export function healthServerLayer<C = never>({
  port: portConfig,
}: {
  port: number | Config.Config<Option.Option<number>>
}): Layer.Layer<never, HttpServerError.ServeError | ConfigError, C> {
  return Effect.gen(function* (_) {
    const portOption = yield* _(
      Config.isConfig(portConfig)
        ? portConfig
        : Config.succeed(Option.some(portConfig))
    )

    if (Option.isNone(portOption))
      return Layer.tap(Layer.empty, () =>
        Effect.log('Health server not running because port is not set')
      )
    const port = portOption.value

    const HealtServerLive = NodeHttpServer.layer(() => createServer(), {
      port,
    })

    const HealthHttpLive = HttpRouter.empty.pipe(
      HttpRouter.get(
        '*',
        Effect.succeed(HttpServerResponse.text('ok', {status: 200}))
      )
    )

    const HealthAppLive = HealthHttpLive.pipe(
      HttpServer.serve(),
      Layer.provide(HealtServerLive),
      Layer.tap(() => Effect.log(`Health server running on port ${port}`)),
      Layer.provide(
        Layer.span('Health server', {attributes: {port: portOption.value}})
      )
    )

    return HealthAppLive
  }).pipe(Layer.unwrapEffect)
}
