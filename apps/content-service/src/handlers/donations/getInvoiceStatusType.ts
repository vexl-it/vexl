import {HttpApiBuilder} from '@effect/platform/index'
import {
  statusToStatusTypeMap,
  type GetInvoiceStatusTypeResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {BtcPayServerService} from '../../utils/donations'
import {UpdateInvoiceStateWebhookService} from './UpdateInvoiceStateWebhookService'

export const getInvoiceStatusTypeHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Donations',
  'getInvoiceStatusType',
  (req) =>
    Effect.gen(function* (_) {
      const btcPayService = yield* _(BtcPayServerService)
      const updateInvoiceStateWebhhokService = yield* _(
        UpdateInvoiceStateWebhookService
      )

      const statusType = yield* _(
        updateInvoiceStateWebhhokService.getInvoiceStatusType({
          invoiceId: req.urlParams.invoiceId,
        }),
        Effect.asSome,
        Effect.catchTag('NotFoundError', () => Effect.succeed(Option.none()))
      )

      if (Option.isSome(statusType))
        return {
          invoiceId: req.urlParams.invoiceId,
          statusType: statusType.value,
        } satisfies GetInvoiceStatusTypeResponse

      const invoice = yield* _(
        btcPayService.getInvoice({
          invoiceId: req.urlParams.invoiceId,
          storeId: req.urlParams.storeId,
        })
      )

      return {
        invoiceId: req.urlParams.invoiceId,
        statusType: statusToStatusTypeMap[invoice.status],
      } satisfies GetInvoiceStatusTypeResponse
    }).pipe(Effect.withSpan('getInvoiceStatusTypeHandler'), makeEndpointEffect)
)
