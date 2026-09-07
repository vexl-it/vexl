import {Effect, pipe} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

describe('Get invoice status type', () => {
  it('should return invoice status type from redis', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp

        const createInvoiceResp = yield* app.Donations.createInvoice({
          payload: {amount: 1, currency: 'EUR', paymentMethod: 'BTC-LN'},
        })

        const resp = yield* pipe(
          app.Donations.getInvoiceStatusType({
            query: {
              invoiceId: createInvoiceResp.invoiceId,
              storeId: createInvoiceResp.storeId,
            },
          }),
          Effect.result
        )

        expect(resp._tag).toEqual('Success')
      })
    )
  })
})
