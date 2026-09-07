import {Cause, Effect, Exit, Result, Schema} from 'effect'
import {makeRequestWithCommonAndSecurityHeaders} from './apiSecurity'
import {CommonHeaders} from './commonHeaders'

class TestSessionNotReadyError extends Schema.TaggedError<TestSessionNotReadyError>(
  'TestSessionNotReadyError'
)('TestSessionNotReadyError', {}) {}

describe('makeRequestWithCommonAndSecurityHeaders', () => {
  const commonHeaders = Schema.decodeUnknownSync(CommonHeaders)({})

  it('does not read credentials while the request is being constructed', () => {
    let credentialsReads = 0
    const withSecurityHeaders = makeRequestWithCommonAndSecurityHeaders(() => {
      credentialsReads++
      throw new TestSessionNotReadyError()
    }, commonHeaders)

    // Constructing the request must neither throw nor read credentials -
    // both happen lazily when the returned effect runs.
    expect(() => withSecurityHeaders(() => Effect.void)).not.toThrow()
    expect(credentialsReads).toBe(0)
  })

  it('surfaces a throwing credentials getter as a defect inside the effect', () => {
    const withSecurityHeaders = makeRequestWithCommonAndSecurityHeaders(() => {
      throw new TestSessionNotReadyError()
    }, commonHeaders)

    const exit = Effect.runSyncExit(
      withSecurityHeaders(() => Effect.void).pipe(
        Effect.catch(() => Effect.void)
      )
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      const defect = Cause.findDefect(exit.cause)
      expect(Result.isSuccess(defect)).toBe(true)
      if (Result.isSuccess(defect)) {
        expect(defect.success).toBeInstanceOf(TestSessionNotReadyError)
      }
    }
  })

  it('reads credentials again on every run of the request effect', () => {
    let credentialsReads = 0
    const withSecurityHeaders = makeRequestWithCommonAndSecurityHeaders(() => {
      credentialsReads++
      throw new TestSessionNotReadyError()
    }, commonHeaders)

    const request = withSecurityHeaders(() => Effect.void)
    Effect.runSyncExit(request)
    Effect.runSyncExit(request)

    expect(credentialsReads).toBe(2)
  })
})
