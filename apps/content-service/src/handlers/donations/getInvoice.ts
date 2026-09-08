import {
  InvoiceId,
  StoreId,
  type GetInvoiceResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, Schema} from 'effect'
import {BtcPayServerService} from '../../utils/donations'

export const getInvoiceHandler = makeHttpApiHandler(
  ContentApiSpecification,
  'Donations',
  'getInvoice',
  (req) =>
    Effect.gen(function* () {
      const btcPayServerService = yield* BtcPayServerService

      const invoiceData = yield* btcPayServerService.getInvoice({
        invoiceId: req.query.invoiceId,
        storeId: req.query.storeId,
      })

      return {
        invoiceId: Schema.decodeSync(InvoiceId)(invoiceData.id),
        storeId: Schema.decodeSync(StoreId)(invoiceData.storeId),
        status: invoiceData.status,
      } satisfies GetInvoiceResponse
    }).pipe(Effect.withSpan('getInvoiceHandler'), makeEndpointEffect)
)
