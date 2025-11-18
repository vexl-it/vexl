import {UnixMilliseconds0} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {GetExchangeRateError} from '@vexl-next/rest-api/src/services/btcExchangeRate/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option} from 'effect'
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
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        getExhangeRatePriceMocked.mockReturnValueOnce(
          Effect.succeed({
            BTC: 30,
            lastUpdatedAt: Option.some(UnixMilliseconds0),
          })
        )

        yield* _(setDummyAuthHeaders)
        const response = yield* _(
          client.getExchangeRate({
            urlParams: {currency: 'USD'},
          })
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

        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getExchangeRate({
            urlParams: {currency: 'USD'},
          }),
          Effect.either
        )

        expectErrorResponse(GetExchangeRateError)(response)
      })
    )
  })
})
