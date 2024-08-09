import {HttpClientRequest} from '@effect/platform'
import {createDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect, Either} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {
  disposeRuntime,
  runPromiseInMockedEnvironment,
  startRuntime,
} from '../utils/runPromiseInMockedEnvironment'

beforeAll(startRuntime)
afterAll(disposeRuntime)

describe('exchange rate', () => {
  it('Fails without auth headers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const response = yield* _(
          client.getExchangeRate({
            query: {currency: 'USD'},
          }),
          Effect.either
        )

        expect(Either.isLeft(response)).toBe(true)
        if (Either.isLeft(response)) {
          expect(response.left._tag).toEqual('ClientError')
        }
      })
    )
  })

  it('Returns 301 redirect on user', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.getExchangeRate(
            {
              query: {currency: 'USD'},
            },
            HttpClientRequest.setHeaders(yield* _(createDummyAuthHeaders))
          ),
          Effect.either
        )

        expect(Either.isLeft(response)).toBe(true)
        if (Either.isLeft(response)) {
          const res = response.left
          expect((res.error as any).cause.code).toEqual('ECONNREFUSED')
        }
      })
    )
  })
})
