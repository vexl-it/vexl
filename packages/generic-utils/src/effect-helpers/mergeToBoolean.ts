import {Effect} from 'effect'
import {flow} from 'fp-ts/lib/function'

export const mergeToBoolean = flow(
  Effect.mapBoth({
    onFailure: () => false,
    onSuccess: () => true,
  }),
  Effect.merge
)
