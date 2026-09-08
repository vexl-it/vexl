import {
  statusToStatusTypeMap,
  type GetInvoiceStatusTypeResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, Option, pipe} from 'effect'
import {BtcPayServerService} from '../../utils/donations'
import {UpdateInvoiceStateWebhookService} from './UpdateInvoiceStateWebhookService'

export const getInvoiceStatusTypeHandler = makeHttpApiHandler(
  ContentApiSpecification,
  'Donations',
  'getInvoiceStatusType',
  (req) =>
    Effect.gen(function* () {
      const btcPayService = yield* BtcPayServerService
      const updateInvoiceStateWebhhokService =
        yield* UpdateInvoiceStateWebhookService

      const statusType = yield* pipe(
        updateInvoiceStateWebhhokService.getInvoiceStatusType({
          invoiceId: req.query.invoiceId,
        }),
        Effect.asSome,
        Effect.catchTag('NotFoundError', () => Effect.succeed(Option.none()))
      )

      if (Option.isSome(statusType))
        return {
          invoiceId: req.query.invoiceId,
          statusType: statusType.value,
        } satisfies GetInvoiceStatusTypeResponse

      const invoice = yield* btcPayService.getInvoice({
        invoiceId: req.query.invoiceId,
        storeId: req.query.storeId,
      })
      const fetchedStatusType = statusToStatusTypeMap[invoice.status]

      return {
        invoiceId: req.query.invoiceId,
        statusType: fetchedStatusType,
      } satisfies GetInvoiceStatusTypeResponse
    }).pipe(Effect.withSpan('getInvoiceStatusTypeHandler'), makeEndpointEffect)
)
