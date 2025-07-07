import {
  GetInvoiceStatusTypeErrors,
  type GetInvoiceStatusTypeResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {GetInvoiceStatusTypeEndpoint} from '@vexl-next/rest-api/src/services/content/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {UpdateInvoiceStateWebhookService} from './UpdateInvoiceStateWebhookService'

export const getInvoiceStatusTypeHandler = Handler.make(
  GetInvoiceStatusTypeEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const updateInvoiceStateWebhhokService = yield* _(
          UpdateInvoiceStateWebhookService
        )

        const statusType = yield* _(
          updateInvoiceStateWebhhokService.getInvoiceStatusType({
            invoiceId: req.query.invoiceId,
          })
        )

        return {
          invoiceId: req.query.invoiceId,
          statusType,
        } satisfies GetInvoiceStatusTypeResponse
      }).pipe(Effect.withSpan('getInvoiceStatusTypeHandler')),
      GetInvoiceStatusTypeErrors
    )
)
