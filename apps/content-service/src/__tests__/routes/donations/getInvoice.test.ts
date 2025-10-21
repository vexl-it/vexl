import {
  type InvoiceId,
  type StoreId,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

describe('Get invoice', () => {
  it('should return invoice details', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const invoiceId = 'invoice_id' as InvoiceId
        const storeId = 'store_id' as StoreId

        const resp = yield* _(
          app.Donations.getInvoice({urlParams: {invoiceId, storeId}}),
          Effect.either
        )

        expect(resp._tag).toEqual('Right')
      })
    )
  })
})
