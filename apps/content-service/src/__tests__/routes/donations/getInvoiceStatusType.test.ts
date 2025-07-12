import {type InvoiceId} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect} from 'effect'
import {UpdateInvoiceStateWebhookService} from '../../../handlers/donations/UpdateInvoiceStateWebhookService'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

const invoiceId = 'test_invoice_id' as InvoiceId

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const updateInvoiceStateService = yield* _(
        UpdateInvoiceStateWebhookService
      )

      updateInvoiceStateService.createOrUpdateInvoiceState({
        invoiceId,
        type: 'InvoiceCreated',
      })
    })
  )
})

describe('Get invoice status type', () => {
  it('should return invoice status type from redis', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const resp = yield* _(
          app.getInvoiceStatusType({query: {invoiceId}}),
          Effect.either
        )

        console.log(`Resp: ${JSON.stringify(resp, null, 2)}`)

        expect(resp._tag).toEqual('Right')
      })
    )
  })
})
