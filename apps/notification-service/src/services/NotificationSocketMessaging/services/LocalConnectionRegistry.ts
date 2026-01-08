import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
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
import {type ConnectionToClient, type StreamConnectionId} from '../domain'

export interface SocketRegistryOperations {
  registerConnection: (
    connection: ConnectionToClient,
    id: StreamConnectionId
  ) => Effect.Effect<void>
  removeConnection: (id: StreamConnectionId) => Effect.Effect<void>
  findConnectionForNotificationToken: (
    id: VexlNotificationTokenSecret
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
                  a.connectionInfo.notificationToken === vexlNotificationToken
              )
            ),
            Effect.map(HashMap.toValues),
            Effect.filterOrFail(Array.isNonEmptyArray)
          ),
      }
    })
  )
}
