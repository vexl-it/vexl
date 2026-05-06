import {InvalidTokenError} from '@vexl-next/rest-api/src/services/content/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Either} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const CLEAR_CACHE_TOKEN = 'dev'

describe('clear cache', () => {
  it('clears cache for a valid admin token header', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const resp = yield* _(
          app.Cms.clearCache({
            headers: {'x-admin-token': CLEAR_CACHE_TOKEN},
          }),
          Effect.either
        )

        expect(Either.isRight(resp)).toBe(true)
      })
    )
  })

  it('returns 401 for an invalid admin token header', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const resp = yield* _(
          app.Cms.clearCache({
            headers: {'x-admin-token': 'bad-token'},
          }),
          Effect.either
        )

        expectErrorResponse(InvalidTokenError)(resp)
      })
    )
  })

  it('does not accept legacy token URL params', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const resp = yield* _(
          app.Cms.clearCache({
            // @ts-expect-error Legacy URL admin-token transport is unsupported.
            urlParams: {token: CLEAR_CACHE_TOKEN},
          }),
          Effect.either
        )

        expect(Either.isLeft(resp)).toBe(true)
      })
    )
  })
})
