import {NotFoundError, UnknownServerError} from '@vexl-next/rest-api/src/Errors'
import {
  GetInvoiceStatusTypeErrors,
  statusToStatusTypeMap,
  type GetInvoiceStatusTypeResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {GetInvoiceStatusTypeEndpoint} from '@vexl-next/rest-api/src/services/content/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {BtcPayServerService} from '../../utils/donations'
import {UpdateInvoiceStateWebhookService} from './UpdateInvoiceStateWebhookService'

export const getInvoiceStatusTypeHandler = Handler.make(
  GetInvoiceStatusTypeEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const btcPayService = yield* _(BtcPayServerService)
        const updateInvoiceStateWebhhokService = yield* _(
          UpdateInvoiceStateWebhookService
        )

        const statusType = yield* _(
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

        const invoice = yield* _(
          btcPayService.getInvoice({
            invoiceId: req.query.invoiceId,
            storeId: req.query.storeId,
          })
        )

        return {
          invoiceId: req.query.invoiceId,
          statusType: statusToStatusTypeMap[invoice.status],
        } satisfies GetInvoiceStatusTypeResponse
      }).pipe(
        Effect.catchAll(
          (e): Effect.Effect<never, GetInvoiceStatusTypeErrors> => {
            if (
              e._tag === 'InvoiceNotFoundError' ||
              e._tag === 'GetInvoiceGeneralError'
            )
              return Effect.fail(
                new NotFoundError({
                  cause: e,
                  message: 'Invoice not found on BTC pay server',
                  status: 404,
                })
              )

            return Effect.fail(new UnknownServerError({cause: e}))
          }
        ),
        Effect.withSpan('getInvoiceStatusTypeHandler')
      ),
      GetInvoiceStatusTypeErrors
    )
)
