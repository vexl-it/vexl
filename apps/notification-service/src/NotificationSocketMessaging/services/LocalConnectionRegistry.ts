import {type NonEmptyArray} from 'effect/Array'
import {type NoSuchElementException} from 'effect/Cause'
import {
  Array,
  Context,
  Effect,
  HashMap,
  Layer,
  Ref,
  SynchronizedRef,
} from 'effect/index'
import {
  vexlNotificationTokenFromExpoToken,
  type ConnectionToClient,
  type StreamConnectionId,
  type VexlNotificationToken,
} from '../domain'

export interface SocketRegistryOperations {
  registerConnection: (
    connection: ConnectionToClient,
    id: StreamConnectionId
  ) => Effect.Effect<void>
  removeConnection: (id: StreamConnectionId) => Effect.Effect<void>
  findConnectionForNotificationToken: (
    id: VexlNotificationToken
  ) => Effect.Effect<NonEmptyArray<ConnectionToClient>, NoSuchElementException>
}

export class LocalConnectionRegistry extends Context.Tag(
  'LocalConnectionRegistry'
)<LocalConnectionRegistry, SocketRegistryOperations>() {
  static Live = Layer.scoped(
    LocalConnectionRegistry,
    Effect.gen(function* (_) {
      const registryRef = yield* _(
        SynchronizedRef.make(
          HashMap.empty<StreamConnectionId, ConnectionToClient>()
        )
      )

      return {
        registerConnection: (record, id) =>
          Ref.update(registryRef, HashMap.set(id, record)),
        removeConnection: (id) => Ref.update(registryRef, HashMap.remove(id)),
        findConnectionForNotificationToken: (vexlNotificationToken) =>
          Ref.get(registryRef).pipe(
            Effect.map(
              HashMap.filter(
                (a) =>
                  vexlNotificationTokenFromExpoToken(
                    a.connectionInfo.notificationToken
                  ) === vexlNotificationToken
              )
            ),
            Effect.map(HashMap.toValues),
            Effect.filterOrFail(Array.isNonEmptyArray)
          ),
      }
    })
  )
}
