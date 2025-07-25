import {Effect} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

describe('Get invoice status type', () => {
  it('should return invoice status type from redis', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const createInvoiceResp = yield* _(
          app.createInvoice({
            body: {amount: 1, currency: 'EUR', paymentMethod: 'BTC-LN'},
          })
        )

        const resp = yield* _(
          app.getInvoiceStatusType({
            query: {
              invoiceId: createInvoiceResp.invoiceId,
              storeId: createInvoiceResp.storeId,
            },
          }),
          Effect.either
        )

        expect(resp._tag).toEqual('Right')
      })
    )
  })
})
