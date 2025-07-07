import {Effect} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

describe('Create invoice', () => {
  it('Should create invoice and return success', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const resp = yield* _(
          app.createInvoice({
            body: {amount: 1, currency: 'EUR', paymentMethod: 'BTC-LN'},
          }),
          Effect.either
        )

        expect(resp._tag).toEqual('Right')
      })
    )
  })
})
