import {
  type InstanceId,
  InstanceIdProvider,
} from '@vexl-next/server-utils/src/InstanceIdProvider'
import {Context, Effect, Layer, type ParseResult, Schema} from 'effect/index'
import {ConnectionManagerChannelId} from '../domain'

const newSenderChannelId = (
  instanceId: InstanceId
): Effect.Effect<ConnectionManagerChannelId, ParseResult.ParseError> =>
  Schema.decode(ConnectionManagerChannelId)(
    `notification-service:notification-connection:${instanceId}`
  )

export class MyManagerIdProvider extends Context.Tag('MyManagerIdProvider')<
  MyManagerIdProvider,
  ConnectionManagerChannelId
>() {
  static Live = Layer.effect(
    MyManagerIdProvider,
    Effect.flatMap(InstanceIdProvider, newSenderChannelId)
  ).pipe(Layer.provide(InstanceIdProvider.Live))
}
