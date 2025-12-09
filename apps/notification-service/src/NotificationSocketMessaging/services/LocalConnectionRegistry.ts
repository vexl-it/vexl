import {type NoSuchElementException} from 'effect/Cause'
import {
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
  type VexlNotificationToken,
} from '../domain'

export interface SocketRegistryOperations {
  registerConnection: (connection: ConnectionToClient) => Effect.Effect<void>
  removeConnection: (id: VexlNotificationToken) => Effect.Effect<void>
  findConnection: (
    id: VexlNotificationToken
  ) => Effect.Effect<ConnectionToClient, NoSuchElementException>
}

export class LocalConnectionRegistry extends Context.Tag(
  'LocalConnectionRegistry'
)<LocalConnectionRegistry, SocketRegistryOperations>() {
  static Live = Layer.scoped(
    LocalConnectionRegistry,
    Effect.gen(function* (_) {
      const registryRef = yield* _(
        SynchronizedRef.make(
          HashMap.empty<VexlNotificationToken, ConnectionToClient>()
        )
      )

      return {
        registerConnection: (record) =>
          Ref.update(
            registryRef,
            HashMap.set(
              vexlNotificationTokenFromExpoToken(
                record.connectionInfo.notificationToken
              ),
              record
            )
          ),
        removeConnection: (id) => Ref.update(registryRef, HashMap.remove(id)),
        findConnection: (id) =>
          Ref.get(registryRef).pipe(Effect.flatMap(HashMap.get(id))),
      }
    })
  )
}
