import {HttpApiBuilder} from '@effect/platform'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {DashboardInternalApiSpecification} from '@vexl-next/rest-api/src/services/dashboard/internalSpecification'
import {makeInternalApiServer} from '@vexl-next/server-utils/src/InternalServer'
import {
  Config,
  Context,
  Effect,
  Layer,
  Option,
  PubSub,
  Ref,
  Stream,
} from 'effect'
import {updatesServerPortConfig} from './configs'
import {
  DashboardBootstrapState,
  isDashboardReady,
} from './dashboardBootstrapState'
import {syncCountOfUsersEffect} from './metrics/countOfUsers'
import {syncPubKeyToCountryEffect} from './metrics/pubKeyToCountry'
import {syncCountriesToConnectionsEffect} from './metrics/pubKeysToConnectionsCount'

type UpdateEvent = 'newUser' | 'newConnections'

class DashboardUpdates extends Context.Tag('DashboardUpdates')<
  DashboardUpdates,
  (updateEvent: UpdateEvent) => Effect.Effect<void, UnexpectedServerError>
>() {}

const DashboardUpdatesLive = Layer.scoped(
  DashboardUpdates,
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

    const bootstrapState = yield* _(DashboardBootstrapState)

    const handleUpdate = (
      updateEvent: UpdateEvent
    ): Effect.Effect<void, UnexpectedServerError> =>
      Effect.gen(function* (_) {
        const dashboardReady = yield* _(isDashboardReady)

        if (!dashboardReady) {
          yield* _(markPendingUpdate(updateEvent))
          return
        }

        const published = yield* _(publishUpdate(updateEvent))
        if (!published) {
          return yield* _(
            Effect.fail(
              new UnexpectedServerError({
                status: 500,
                message: `Failed to publish dashboard update: ${updateEvent}`,
              })
            )
          )
        }
      }).pipe(Effect.provideService(DashboardBootstrapState, bootstrapState))

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
        Effect.forkScoped
      )
    )

    yield* _(
      updateStream.pipe(
        Stream.filter((a) => a === 'newUser'),
        Stream.debounce('1 second'),
        Stream.tap(() => Effect.log('Syncing new users')),
        Stream.runForEach(() => syncPubKeyToCountryEffect),
        Effect.catchAll((e) => Effect.logError('Error while syncing users', e)),
        Effect.catchAllDefect((e) =>
          Effect.logError('Defect while syncing users', e)
        ),
        Effect.forkScoped
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
        Effect.forkScoped
      )
    )

    return handleUpdate
  })
)

const UpdatesApiGroupLive = HttpApiBuilder.group(
  DashboardInternalApiSpecification,
  'Updates',
  (h) =>
    h
      .handle('reportNewUser', () =>
        DashboardUpdates.pipe(Effect.flatMap((update) => update('newUser')))
      )
      .handle('reportNewConnections', () =>
        DashboardUpdates.pipe(
          Effect.flatMap((update) => update('newConnections'))
        )
      )
)

export const UpdatesServerLive = makeInternalApiServer(
  HttpApiBuilder.api(DashboardInternalApiSpecification).pipe(
    Layer.provide(UpdatesApiGroupLive)
  ),
  {port: updatesServerPortConfig.pipe(Config.map(Option.some))}
).pipe(Layer.provide(DashboardUpdatesLive), Layer.withSpan('Updates server'))
