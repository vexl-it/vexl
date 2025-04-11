import {Effect} from 'effect'

export const andThenExpectBooleanNoErrors =
  (f: (arg: boolean) => void) => (self: Effect.Effect<boolean, never, never>) =>
    Effect.andThen(self, f)
