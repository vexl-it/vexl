import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  type CryptoError,
  pbkdf2,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {randomBytes} from 'crypto'
import {Array, Effect, pipe} from 'effect'

export const testHasingSpeed = (
  iterations: number,
  numberOfElements: number
): Effect.Effect<number, CryptoError, never> =>
  Effect.gen(function* () {
    const dummySecret = randomBytes(32).toString('base64')
    const elements = Array.makeBy(numberOfElements, () =>
      randomBytes(16).toString('base64')
    )

    yield* Effect.logInfo(
      `Starting hashing speed test with ${iterations} iterations and ${numberOfElements} elements`
    )
    const startTime = unixMillisecondsNow()
    yield* pipe(
      elements,
      Array.map((one) =>
        pbkdf2({password: one, salt: dummySecret, iterations})
      ),
      (effects) => Effect.all(effects, {concurrency: 'unbounded'})
    )
    const endTime = unixMillisecondsNow()
    const duration = endTime - startTime
    yield* Effect.logInfo(`Completed hashing speed test in ${duration} ms`)

    return duration
  }).pipe(Effect.withSpan('testHasingSpeed'))
