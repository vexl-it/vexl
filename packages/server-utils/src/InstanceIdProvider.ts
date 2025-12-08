import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Context, Effect, Layer, Schema} from 'effect/index'
import os from 'os'

export const InstanceId = Schema.String.pipe(Schema.brand('InstanceId'))
export type InstanceId = typeof InstanceId.Type

export class InstanceIdProvider extends Context.Tag('InstanceIdProvider')<
  InstanceIdProvider,
  InstanceId
>() {
  static Live = Layer.effect(
    InstanceIdProvider,
    Effect.flatMap(
      Effect.sync(() => os.hostname() ?? generateUuid()),
      Schema.decode(InstanceId)
    )
  )
}
