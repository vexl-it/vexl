import {
  HttpMiddleware,
  HttpRouter,
  HttpServer,
  HttpServerResponse,
} from '@effect/platform'
import {NodeHttpServer} from '@effect/platform-node'
import {Effect, Layer, PubSub, Ref, Stream} from 'effect'
import {createServer} from 'http'
import {updatesServerPortConfig} from './configs'
import {
  DashboardBootstrapState,
  isDashboardReady,
} from './dashboardBootstrapState'
import {syncCountOfUsersEffect} from './metrics/countOfUsers'
import {syncPubKeyToCountryEffect} from './metrics/pubKeyToCountry'
import {syncCountriesToConnectionsEffect} from './metrics/pubKeysToConnectionsCount'

const ServerLive = NodeHttpServer.layerConfig(() => createServer(), {
  port: updatesServerPortConfig,
})

type UpdateEvent = 'newUser' | 'newConnections'

export const UpdatesServerLive = Layer.scopedDiscard(
  Effect.gen(function* (_) {
    const updateEventPubSub = yield* _(PubSub.bounded<UpdateEvent>(1))
    const pendingNewUserUpdateRef = yield* _(Ref.make(false))
    const pendingNewConnectionsUpdateRef = yield* _(Ref.make(false))

    const publishUpdate = (
      updateEvent: UpdateEvent
    ): Effect.Effect<boolean, never> =>
      PubSub.publish(updateEventPubSub, updateEvent)

    const markPendingUpdate = (
      updateEvent: UpdateEvent
    ): Effect.Effect<void, never> =>
      updateEvent === 'newUser'
        ? Ref.set(pendingNewUserUpdateRef, true)
        : Ref.set(pendingNewConnectionsUpdateRef, true)

    const publishPendingUpdate = (
      updateEvent: UpdateEvent
    ): Effect.Effect<void, never> =>
      Effect.gen(function* (_) {
        const pendingUpdateRef =
          updateEvent === 'newUser'
            ? pendingNewUserUpdateRef
            : pendingNewConnectionsUpdateRef
        const hadPendingUpdate = yield* _(
          Ref.getAndSet(pendingUpdateRef, false)
        )

        if (!hadPendingUpdate) return

        yield* _(
          Effect.log(`Flushing buffered dashboard update: ${updateEvent}`)
        )
        yield* _(publishUpdate(updateEvent))
      })

    const handleUpdateRequest = (
      updateEvent: UpdateEvent
    ): Effect.Effect<
      HttpServerResponse.HttpServerResponse,
      never,
      DashboardBootstrapState
    > =>
      Effect.gen(function* (_) {
        const dashboardReady = yield* _(isDashboardReady)

        if (!dashboardReady) {
          yield* _(markPendingUpdate(updateEvent))
          return HttpServerResponse.raw('accepted')
        }

        const published = yield* _(publishUpdate(updateEvent))
        return published
          ? HttpServerResponse.raw('accepted')
          : HttpServerResponse.raw('Error', {status: 500})
      })

    const RouterLive = HttpRouter.empty.pipe(
      HttpRouter.post('/new-user', handleUpdateRequest('newUser')),
      HttpRouter.post('/new-connections', handleUpdateRequest('newConnections'))
    )

    const updateStream = Stream.fromPubSub(updateEventPubSub)

    yield* _(
      DashboardBootstrapState.pipe(
        Effect.map((state) => state.changes),
        Stream.unwrap,
        Stream.filter((status) => status.status === 'ready'),
        Stream.take(1),
        Stream.runForEach(() =>
          Effect.gen(function* (_) {
            yield* _(publishPendingUpdate('newUser'))
            yield* _(publishPendingUpdate('newConnections'))
          })
        ),
        Effect.catchAllCause((cause) =>
          Effect.logError(
            'Error while flushing buffered dashboard updates',
            cause
          )
        ),
        Effect.fork
      )
    )

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
          Effect.gen(function* (_) {
            yield* _(syncCountriesToConnectionsEffect)
            yield* _(syncCountOfUsersEffect)
          })
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
