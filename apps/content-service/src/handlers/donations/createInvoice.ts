import {
  CreateInvoiceError,
  CreateInvoiceErrors,
  InvoiceId,
  PaymentLink,
  StoreId,
  type CreateInvoiceResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {CreateInvoiceEndpoint} from '@vexl-next/rest-api/src/services/content/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Option, Schema} from 'effect'
import {Handler} from 'effect-http'
import {BtcPayServerService} from '../../utils/donations'
import {UpdateInvoiceStateWebhookService} from './UpdateInvoiceStateWebhookService'

export const createInvoiceHandler = Handler.make(CreateInvoiceEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const btcPayServerService = yield* _(BtcPayServerService)
      const updateInvoiceStateWebhookService = yield* _(
        UpdateInvoiceStateWebhookService
      )

      const createInvoiceResponse = yield* _(
        btcPayServerService.createInvoice({
          amount: req.body.amount,
          currency: req.body.currency,
          paymentMethod: req.body.paymentMethod,
        })
      )

      const paymentMethods = yield* _(
        btcPayServerService.getInvoicePaymentMethods({
          invoiceId: createInvoiceResponse.id,
          storeId: createInvoiceResponse.storeId,
        })
      )

      const paymentMethod = Array.findFirst(
        paymentMethods,
        (method) => method.paymentMethodId === req.body.paymentMethod
      )

      if (Option.isNone(paymentMethod))
        return yield* _(
          Effect.fail(
            new CreateInvoiceError({
              cause: new Error(
                `No ${req.body.paymentMethod} payment method found`
              ),
              message: `No ${req.body.paymentMethod} payment method found`,
            })
          )
        )

      yield* _(
        updateInvoiceStateWebhookService.createOrUpdateInvoiceState({
          invoiceId: Schema.decodeSync(InvoiceId)(createInvoiceResponse.id),
          type: 'InvoiceCreated',
        })
      )

      const toReturn = {
        invoiceId: Schema.decodeSync(InvoiceId)(createInvoiceResponse.id),
        storeId: Schema.decodeSync(StoreId)(createInvoiceResponse.storeId),
        paymentLink: Schema.decodeSync(PaymentLink)(
          paymentMethod.value.paymentLink
        ),
        exchangeRate: paymentMethod.value.rate,
        btcAmount: paymentMethod.value.amount,
        fiatAmount: createInvoiceResponse.amount,
        currency: 'EUR',
        paymentMethod: paymentMethod.value.paymentMethodId,
        status: createInvoiceResponse.status,
        createdTime: createInvoiceResponse.createdTime,
        expirationTime: createInvoiceResponse.expirationTime,
      } satisfies CreateInvoiceResponse

      return toReturn
    }).pipe(Effect.withSpan('createInvoiceHandler')),
    CreateInvoiceErrors
  )
)
