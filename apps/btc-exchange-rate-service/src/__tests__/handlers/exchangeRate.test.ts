import {UnixMilliseconds0} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {GetExchangeRateError} from '@vexl-next/rest-api/src/services/btcExchangeRate/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, pipe} from 'effect'
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
  it('Returns proper exchange rate', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        getExhangeRatePriceMocked.mockReturnValueOnce(
          Effect.succeed({
            BTC: 30,
            lastUpdatedAt: Option.some(UnixMilliseconds0),
          })
        )

        yield* setDummyAuthHeaders
        const response = yield* client.getExchangeRate({
          query: {currency: 'USD'},
        })

        expect(response).toEqual({
          BTC: 30,
          lastUpdatedAt: Option.some(UnixMilliseconds0),
        })
      })
    )
  })

  it('Returns proper error when yadio throws error', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        getExhangeRatePriceMocked.mockReturnValueOnce(
          Effect.fail(
            new GetExchangeRateError({status: 502, reason: 'YadioError'})
          )
        )

        yield* setDummyAuthHeaders

        const response = yield* pipe(
          client.getExchangeRate({
            query: {currency: 'USD'},
          }),
          Effect.result
        )

        expectErrorResponse(GetExchangeRateError)(response)
      })
    )
  })
})
