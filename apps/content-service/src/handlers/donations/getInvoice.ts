import {HttpApiBuilder} from '@effect/platform/index'
import {
  InvoiceId,
  StoreId,
  type GetInvoiceResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Schema} from 'effect'
import {BtcPayServerService} from '../../utils/donations'

export const getInvoiceHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Donations',
  'getInvoice',
  (req) =>
    Effect.gen(function* (_) {
      const btcPayServerService = yield* _(BtcPayServerService)

      const invoiceData = yield* _(
        btcPayServerService.getInvoice({
          invoiceId: req.urlParams.invoiceId,
          storeId: req.urlParams.storeId,
        })
      )

      return {
        invoiceId: Schema.decodeSync(InvoiceId)(invoiceData.id),
        storeId: Schema.decodeSync(StoreId)(invoiceData.storeId),
        status: invoiceData.status,
      } satisfies GetInvoiceResponse
    }).pipe(Effect.withSpan('getInvoiceHandler'), makeEndpointEffect)
)
