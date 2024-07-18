import {
  HttpMiddleware,
  HttpRouter,
  HttpServer,
  HttpServerResponse,
} from '@effect/platform'
import {NodeHttpServer} from '@effect/platform-node'
import {Effect, Layer, PubSub, Stream} from 'effect'
import {createServer} from 'http'
import {updatesServerPortConfig} from './configs'
import {syncCountOfUsersEffect} from './metrics/countOfUsers'
import {syncPubKeyToCountryEffect} from './metrics/pubKeyToCountry'
import {syncCountriesToConnectionsEffect} from './metrics/pubKeysToConnectionsCount'

const ServerLive = NodeHttpServer.layerConfig(() => createServer(), {
  port: updatesServerPortConfig,
})

export const UpdatesServerLive = Layer.scopedDiscard(
  Effect.gen(function* (_) {
    const updateEventPubSub = yield* _(
      PubSub.bounded<'newUser' | 'newConnections'>(1)
    )

    const RouterLive = HttpRouter.empty.pipe(
      HttpRouter.post(
        '/new-user',
        Effect.gen(function* (_) {
          const published = yield* _(
            PubSub.publish(updateEventPubSub, 'newUser')
          )
          return published
            ? HttpServerResponse.raw('accepted')
            : HttpServerResponse.raw('Error', {status: 500})
        })
      ),
      HttpRouter.post(
        '/new-connections',
        Effect.gen(function* (_) {
          const published = yield* _(
            PubSub.publish(updateEventPubSub, 'newConnections')
          )
          return published
            ? HttpServerResponse.raw('accepted')
            : HttpServerResponse.raw('Error', {status: 500})
        })
      )
    )

    const updateStream = Stream.fromPubSub(updateEventPubSub)

    yield* _(
      updateStream.pipe(
        Stream.filter((a) => a === 'newUser'),
        Stream.debounce('1 second'),
        Stream.tap(() => Effect.log('Syncing new users')),
        Stream.runForEach(() => syncPubKeyToCountryEffect),
        Effect.catchAll((e) => Effect.log('Error while syncing users', e)),
        Effect.catchAllDefect((e) =>
          Effect.log('Defect while syncing users', e)
        ),
        Effect.fork
      )
    )

    yield* _(
      updateStream.pipe(
        Stream.filter((a) => a === 'newConnections'),
        Stream.debounce('1 second'),
        Stream.tap(() => Effect.log('Syncing connections')),
        Stream.runForEach(() =>
          Effect.all(
            [syncCountriesToConnectionsEffect, syncCountOfUsersEffect],
            {concurrency: 'unbounded'}
          )
        ),
        Effect.catchAll((e) =>
          Effect.log('Error while syncing connections', e)
        ),
        Effect.catchAllDefect((e) =>
          Effect.log('Defect while syncing connections', e)
        ),
        Effect.fork
      )
    )

    yield* _(
      RouterLive.pipe(
        HttpServer.serve(HttpMiddleware.logger),
        Layer.provide(ServerLive),
        Layer.tap((_) =>
          Effect.flatMap(updatesServerPortConfig, (p) =>
            Effect.log(`Running updates server on port ${p}`)
          )
        ),
        Layer.launch
      )
    )
  })
).pipe(Layer.withSpan('Updates server'))
