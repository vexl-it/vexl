import {UnauthorizedError} from '@vexl-next/domain/src/general/commonErrors'
import {
  BtcPayServerWebhookHeader,
  BtcPayWebhookShaSignature,
} from '@vexl-next/rest-api/src/btcPayServerWebhookHeader'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, pipe, Schema} from 'effect'
import * as crypto from 'node:crypto'
import {btcPayServerWebhookSecretConfig} from '../../../configs'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

describe('Update invoice status type webhook', () => {
  it('Should update invoice status type in redis correctly', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const btcPayServerWebhookSecret = yield* btcPayServerWebhookSecretConfig

        const createInvoiceResp = yield* app.Donations.createInvoice({
          payload: {amount: 1, currency: 'EUR', paymentMethod: 'BTC-LN'},
        })

        const body = {
          deliveryId: 'TsXk94uV6nqoN955SY6vTu',
          webhookId: 'FS2DtTiKdW9DrDou5SoFWN',
          originalDeliveryId: 'TsXk94uV6nqoN955SY6vTu',
          isRedelivery: false,
          type: 'InvoiceExpired',
          timestamp: 1752067301,
          storeId: 'DkojeAq1dse2AUSdnqQuCFBSdysx5og5gfYJcBvfjaRT',
          invoiceId: createInvoiceResp.invoiceId,
          metadata: {
            orderId: 'vexl-donation_phTeiR31YstCBmxo_L31d',
            orderUrl:
              'https://pay.satoshilabs.com/apps/3r54iLzBDuB99zDV8s4SQTy3cvua/pos',
            itemDesc: 'Donation to Vexl Foundation',
          },
        } as const

        const btcPayServerSignature =
          `sha256=` +
          crypto
            .createHmac('sha256', btcPayServerWebhookSecret)
            .update(JSON.stringify(body))
            .digest('hex')

        yield* app.Donations.updateInvoiceStateWebhook({
          headers: new BtcPayServerWebhookHeader({
            'btcpay-sig': Schema.decodeSync(BtcPayWebhookShaSignature)(
              btcPayServerSignature
            ),
          }),
          payload: body,
        })

        const resp = yield* app.Donations.getInvoiceStatusType({
          query: {
            invoiceId: createInvoiceResp.invoiceId,
            storeId: createInvoiceResp.storeId,
          },
        })

        expect(resp.invoiceId).toEqual(body.invoiceId)
        expect(resp.statusType).toEqual(body.type)
      })
    )
  })

  it('Should fail for invalid btc pay server signature', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const app = yield* NodeTestingApp
        const btcPayServerWebhookSecret = yield* btcPayServerWebhookSecretConfig

        const createInvoiceResp = yield* app.Donations.createInvoice({
          payload: {amount: 1, currency: 'EUR', paymentMethod: 'BTC-LN'},
        })

        const body = {
          deliveryId: 'TsXk94uV6nqoN955SY6vTu',
          webhookId: 'FS2DtTiKdW9DrDou5SoFWN',
          originalDeliveryId: 'TsXk94uV6nqoN955SY6vTu',
          isRedelivery: false,
          type: 'InvoiceExpired',
          timestamp: 1752067301,
          storeId: 'DkojeAq1dse2AUSdnqQuCFBSdysx5og5gfYJcBvfjaRT',
          invoiceId: createInvoiceResp.invoiceId,
          metadata: {
            orderId: 'vexl-donation_phTeiR31YstCBmxo_L31d',
            orderUrl:
              'https://pay.satoshilabs.com/apps/3r54iLzBDuB99zDV8s4SQTy3cvua/pos',
            itemDesc: 'Donation to Vexl Foundation',
          },
        } as const

        const btcPayServerSignature =
          `sha256=` +
          crypto
            .createHmac('sha256', btcPayServerWebhookSecret)
            .update(JSON.stringify({...body, isRedelivery: true}))
            .digest('hex')

        const resp = yield* pipe(
          app.Donations.updateInvoiceStateWebhook({
            headers: new BtcPayServerWebhookHeader({
              'btcpay-sig': Schema.decodeSync(BtcPayWebhookShaSignature)(
                btcPayServerSignature
              ),
            }),
            payload: body,
          }),
          Effect.result
        )

        expectErrorResponse(UnauthorizedError)(resp)
      })
    )
  })
})
