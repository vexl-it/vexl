import {
  type InvoiceId,
  type StoreId,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, pipe} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

describe('Get invoice', () => {
  it('should return invoice details', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const invoiceId = 'invoice_id' as InvoiceId
        const storeId = 'store_id' as StoreId

        const resp = yield* pipe(
          app.Donations.getInvoice({query: {invoiceId, storeId}}),
          Effect.result
        )

        expect(resp._tag).toEqual('Success')
      })
    )
  })
})
