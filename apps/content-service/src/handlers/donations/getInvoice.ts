import {
  GetInvoiceErrors,
  type GetInvoiceResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {GetInvoiceEndpoint} from '@vexl-next/rest-api/src/services/content/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Handler} from 'effect-http'
import {Effect} from 'effect/index'
import {BtcPayServerService} from '../../utils/donations'

export const getInvoiceHandler = Handler.make(GetInvoiceEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const btcPayServerService = yield* _(BtcPayServerService)

      const invoiceData = yield* _(
        btcPayServerService.getInvoice({
          invoiceId: req.query.invoiceId,
          storeId: req.query.storeId,
        })
      )

      return {
        invoiceId: invoiceData.id,
        storeId: invoiceData.storeId,
        status: invoiceData.status,
      } satisfies GetInvoiceResponse
    }),
    GetInvoiceErrors
  )
)
