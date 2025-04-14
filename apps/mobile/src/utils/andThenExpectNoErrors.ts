import {Effect} from 'effect'

export const andThenExpectBooleanNoErrors =
  (f: (arg: boolean) => void) => (self: Effect.Effect<boolean, never, never>) =>
    Effect.andThen(self, f)

export const andThenExpectVoidNoErrors =
  (f: () => void) => (self: Effect.Effect<void, never, never>) =>
    Effect.andThen(self, f)
