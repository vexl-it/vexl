import {Effect} from 'effect'

const ENCRYPTION_TIME_SLICE_MS = 8

// Create inside the batch's Effect.gen so each execution has its own clock.
// Native crypto can run synchronously despite its Promise wrapper. Yield
// before the first recipient and between time slices so UI timers can run.
// This is a simple fix for now. If yielding is not enough, we can move
// encryption to a native worker in the future.
export function createEncryptionYield(): Effect.Effect<void> {
  let lastYieldAt: number | undefined

  return Effect.suspend(() => {
    if (
      lastYieldAt !== undefined &&
      Date.now() - lastYieldAt < ENCRYPTION_TIME_SLICE_MS
    )
      return Effect.void

    return Effect.sleep(1).pipe(
      Effect.tap(() => {
        lastYieldAt = Date.now()
      })
    )
  })
}
