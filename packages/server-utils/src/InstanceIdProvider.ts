import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Context, Effect, Layer, Schema} from 'effect'
import os from 'os'

export const InstanceId = Schema.String.pipe(Schema.brand('InstanceId'))
export type InstanceId = typeof InstanceId.Type

export class InstanceIdProvider extends Context.Service<
  InstanceIdProvider,
  InstanceId
>()('InstanceIdProvider') {
  static Live = Layer.effect(
    InstanceIdProvider,
    Effect.flatMap(
      Effect.sync(() => os.hostname() ?? generateUuid()),
      Schema.decodeEffect(InstanceId)
    )
  )
}
