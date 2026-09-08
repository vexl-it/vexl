import {Effect, pipe} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

describe('Create invoice', () => {
  it('Should create invoice and return success', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const resp = yield* pipe(
          app.Donations.createInvoice({
            payload: {amount: 1, currency: 'EUR', paymentMethod: 'BTC-LN'},
          }),
          Effect.result
        )

        expect(resp._tag).toEqual('Success')
      })
    )
  })
})
