import {
  type InstanceId,
  InstanceIdProvider,
} from '@vexl-next/server-utils/src/InstanceIdProvider'
import {Context, Effect, Layer, Schema} from 'effect'
import {ConnectionManagerChannelId} from '../domain'

const newSenderChannelId = (
  instanceId: InstanceId
): Effect.Effect<ConnectionManagerChannelId, Schema.SchemaError> =>
  Schema.decodeEffect(ConnectionManagerChannelId)(
    `notification-service:notification-connection:${instanceId}`
  )

export class MyManagerIdProvider extends Context.Service<
  MyManagerIdProvider,
  ConnectionManagerChannelId
>()('MyManagerIdProvider') {
  static Live = Layer.effect(
    MyManagerIdProvider,
    Effect.flatMap(InstanceIdProvider, newSenderChannelId)
  ).pipe(Layer.provide(InstanceIdProvider.Live))
}
