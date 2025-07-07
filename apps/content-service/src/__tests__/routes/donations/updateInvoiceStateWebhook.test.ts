import {BtcPayWebhookShaSignature} from '@vexl-next/rest-api/src/btcPayServerWebhookHeader'
import {UnauthorizedError} from '@vexl-next/rest-api/src/Errors'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Option, Schema} from 'effect'
import * as crypto from 'node:crypto'
import {btcPayServerWebhookSecretConfig} from '../../../configs'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'

describe('Update invoice status type webhook', () => {
  it('Should update invoice status type in redis correctly', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const btcPayServerWebhookSecret = yield* _(
          btcPayServerWebhookSecretConfig
        )

        const createInvoiceResp = yield* _(
          app.createInvoice({
            body: {amount: 1, currency: 'EUR', paymentMethod: 'BTC-LN'},
          })
        )

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
            .update(JSON.stringify(body, null, 2))
            .digest('hex')

        yield* _(
          app.updateInvoiceStateWebhook({
            headers: {
              btcPayWebhookSignatureOrNone: Option.some(
                Schema.decodeSync(BtcPayWebhookShaSignature)(
                  btcPayServerSignature
                )
              ),
              'btcpay-sig': Schema.decodeSync(BtcPayWebhookShaSignature)(
                btcPayServerSignature
              ),
            },
            body,
          })
        )

        const resp = yield* _(
          app.getInvoiceStatusType({
            query: {
              invoiceId: createInvoiceResp.invoiceId,
              storeId: createInvoiceResp.storeId,
            },
          })
        )

        expect(resp.invoiceId).toEqual(body.invoiceId)
        expect(resp.statusType).toEqual(body.type)
      })
    )
  })

  it('Should fail for invalid btc pay server signature', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const btcPayServerWebhookSecret = yield* _(
          btcPayServerWebhookSecretConfig
        )

        const createInvoiceResp = yield* _(
          app.createInvoice({
            body: {amount: 1, currency: 'EUR', paymentMethod: 'BTC-LN'},
          })
        )

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
            .update(JSON.stringify({...body, isRedelivery: true}, null, 2))
            .digest('hex')

        const resp = yield* _(
          app.updateInvoiceStateWebhook({
            headers: {
              btcPayWebhookSignatureOrNone: Option.some(
                Schema.decodeSync(BtcPayWebhookShaSignature)(
                  btcPayServerSignature
                )
              ),
              'btcpay-sig': Schema.decodeSync(BtcPayWebhookShaSignature)(
                btcPayServerSignature
              ),
            },
            body,
          }),
          Effect.either
        )

        expectErrorResponse(UnauthorizedError)(resp)
      })
    )
  })
})
