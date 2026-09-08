import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import {Effect, Layer, PubSub, Ref, Stream, SubscriptionRef} from 'effect'
import {HttpRouter, HttpServerResponse} from 'effect/unstable/http'
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

export const UpdatesServerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const updateEventPubSub = yield* PubSub.bounded<UpdateEvent>(1)
    const pendingNewUserUpdateRef = yield* Ref.make(false)
    const pendingNewConnectionsUpdateRef = yield* Ref.make(false)

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
      Effect.gen(function* () {
        const pendingUpdateRef =
          updateEvent === 'newUser'
            ? pendingNewUserUpdateRef
            : pendingNewConnectionsUpdateRef
        const hadPendingUpdate = yield* Ref.getAndSet(pendingUpdateRef, false)

        if (!hadPendingUpdate) return

        yield* Effect.log(`Flushing buffered dashboard update: ${updateEvent}`)
        yield* publishUpdate(updateEvent)
      })

    const handleUpdateRequest = (
      updateEvent: UpdateEvent
    ): Effect.Effect<
      HttpServerResponse.HttpServerResponse,
      never,
      DashboardBootstrapState
    > =>
      Effect.gen(function* () {
        const dashboardReady = yield* isDashboardReady

        if (!dashboardReady) {
          yield* markPendingUpdate(updateEvent)
          return HttpServerResponse.raw('accepted')
        }

        const published = yield* publishUpdate(updateEvent)
        return published
          ? HttpServerResponse.raw('accepted')
          : HttpServerResponse.raw('Error', {status: 500})
      })

    const RouterLive = Layer.mergeAll(
      HttpRouter.add('POST', '/new-user', handleUpdateRequest('newUser')),
      HttpRouter.add(
        'POST',
        '/new-connections',
        handleUpdateRequest('newConnections')
      )
    )

    const updateStream = Stream.fromPubSub(updateEventPubSub)

    yield* DashboardBootstrapState.pipe(
      Effect.map((state) => SubscriptionRef.changes(state)),
      Stream.unwrap,
      Stream.filter((status) => status.status === 'ready'),
      Stream.take(1),
      Stream.runForEach(() =>
        Effect.gen(function* () {
          yield* publishPendingUpdate('newUser')
          yield* publishPendingUpdate('newConnections')
        })
      ),
      Effect.catchCause((cause) =>
        Effect.logError(
          'Error while flushing buffered dashboard updates',
          cause
        )
      ),
      Effect.forkChild
    )

    yield* updateStream.pipe(
      Stream.filter((a) => a === 'newUser'),
      Stream.debounce('1 second'),
      Stream.tap(() => Effect.log('Syncing new users')),
      Stream.runForEach(() => syncPubKeyToCountryEffect),
      Effect.catch((e) => Effect.logError('Error while syncing users', e)),
      Effect.catchDefect((e) =>
        Effect.logError('Defect while syncing users', e)
      ),
      Effect.forkChild
    )

    yield* updateStream.pipe(
      Stream.filter((a) => a === 'newConnections'),
      Stream.debounce('1 second'),
      Stream.tap(() => Effect.log('Syncing connections')),
      Stream.runForEach(() =>
        Effect.gen(function* () {
          yield* syncCountriesToConnectionsEffect
          yield* syncCountOfUsersEffect
        })
      ),
      Effect.catch((e) => Effect.log('Error while syncing connections', e)),
      Effect.catchDefect((e) =>
        Effect.log('Defect while syncing connections', e)
      ),
      Effect.forkChild
    )

    yield* HttpRouter.serve(RouterLive).pipe(
      Layer.provide(ServerLive),
      Layer.tap((_) =>
        Effect.flatMap(updatesServerPortConfig, (p) =>
          Effect.log(`Running updates server on port ${p}`)
        )
      ),
      Layer.launch
    )
  })
).pipe(Layer.withSpan('Updates server'))
