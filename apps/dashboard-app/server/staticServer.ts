import {Data, Effect, Layer} from 'effect'
import http from 'http'
import handler from 'serve-handler'
import {clientServerPortConfig, isRunningInDevConfig} from './configs'

class StaticServerError extends Data.TaggedError('StaticServerError') {}

export const StaticServerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    yield* Effect.log('Starting static server')
    if (yield* isRunningInDevConfig) {
      yield* Effect.log('Skipping static server in development')
      return yield* Effect.void
    }
    const port = yield* clientServerPortConfig
    yield* Effect.log(`Starting static server on port: ${port}`)

    yield* Effect.acquireRelease(
      Effect.callback<ReturnType<typeof http.createServer>, StaticServerError>(
        (cb) => {
          const server = http.createServer((req, res) => {
            void handler(req, res, {
              public: './dist/client',
            })
          })

          server.listen(port, () => {
            cb(
              Effect.tap(
                Effect.succeed(server),
                Effect.log(`Client server listening on port: ${port}`)
              )
            )
          })
          server.on('error', (e) => {
            cb(
              Effect.tap(
                new StaticServerError(),
                Effect.logError('Error on static server', e)
              )
            )
          })
        }
      ),
      (server) => Effect.sync(() => server.close())
    )
  })
).pipe(Layer.withSpan('StaticServerLive'))
