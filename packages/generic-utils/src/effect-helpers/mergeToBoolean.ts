import {Effect} from 'effect'
import {flow} from 'fp-ts/lib/function'

export const mergeToBoolean = flow(
  Effect.match({
    onFailure: () => false,
    onSuccess: () => true,
  })
)
