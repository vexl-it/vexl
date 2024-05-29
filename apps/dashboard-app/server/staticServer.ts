import {Data, Effect, Layer} from 'effect'
import http from 'http'
import handler from 'serve-handler'
import {clientServerPortConfig, isRunningInDevConfig} from './configs'

class StaticServerError extends Data.TaggedError('StaticServerError') {}

export const StaticServerLive = Layer.scopedDiscard(
  Effect.gen(function* (_) {
    yield* _(Effect.log('Starting static server'))
    if (yield* _(isRunningInDevConfig)) {
      yield* _(Effect.log('Skipping static server in development'))
      return yield* _(Effect.void)
    }
    const port = yield* _(clientServerPortConfig)
    yield* _(Effect.log(`Starting static server on port: ${port}`))

    yield* _(
      Effect.acquireRelease(
        Effect.async<ReturnType<typeof http.createServer>, StaticServerError>(
          (cb) => {
            const server = http.createServer((req, res) => {
              void handler(req, res, {
                public: './dist/client',
              })
            })

            server.listen(port, () => {
              cb(
                Effect.zipLeft(
                  Effect.succeed(server),
                  Effect.log(`Client server listening on port: ${port}`)
                )
              )
            })
            server.on('error', (e) => {
              cb(
                Effect.zipLeft(
                  new StaticServerError(),
                  Effect.logError('Error on static server', e)
                )
              )
            })
          }
        ),
        (server) => Effect.sync(() => server.close())
      )
    )
  })
).pipe(Layer.withSpan('StaticServerLive'))
