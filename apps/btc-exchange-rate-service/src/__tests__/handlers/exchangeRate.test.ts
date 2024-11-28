import {HttpClientRequest} from '@effect/platform'
import {UnixMilliseconds0} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {GetExchangeRateError} from '@vexl-next/rest-api/src/services/btcExchangeRate/contracts'
import {createDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect, Either, Option} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {getExhangeRatePriceMocked} from '../utils/mockedYadioLayer'
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

  it('Returns proper exchange rate', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        getExhangeRatePriceMocked.mockReturnValueOnce(
          Effect.succeed({
            BTC: 30,
            lastUpdatedAt: Option.some(UnixMilliseconds0),
          })
        )

        const response = yield* _(
          client.getExchangeRate(
            {
              query: {currency: 'USD'},
            },
            HttpClientRequest.setHeaders(yield* _(createDummyAuthHeaders))
          )
        )

        expect(response).toEqual({
          BTC: 30,
          lastUpdatedAt: Option.some(UnixMilliseconds0),
        })
      })
    )
  })

  it('Returns proper error when yadio throws error', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        getExhangeRatePriceMocked.mockReturnValueOnce(
          Effect.fail(
            new GetExchangeRateError({status: 400, reason: 'YadioError'})
          )
        )

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
          expect(response.left._tag).toEqual('ClientError')
          expect((response.left.error as any)._tag).toEqual(
            'GetExchangeRateError'
          )
        }
      })
    )
  })
})
