import {
  CreateInvoiceError,
  InvoiceId,
  PaymentLink,
  StoreId,
  type CreateInvoiceResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Array, Effect, Option, Schema} from 'effect'
import {BtcPayServerService} from '../../utils/donations'
import {UpdateInvoiceStateWebhookService} from './UpdateInvoiceStateWebhookService'

export const createInvoiceHandler = makeHttpApiHandler(
  ContentApiSpecification,
  'Donations',
  'createInvoice',
  (req) =>
    Effect.gen(function* () {
      const btcPayServerService = yield* BtcPayServerService
      const updateInvoiceStateWebhookService =
        yield* UpdateInvoiceStateWebhookService

      const createInvoiceResponse = yield* btcPayServerService.createInvoice({
        amount: req.payload.amount,
        currency: req.payload.currency,
        paymentMethod: req.payload.paymentMethod,
      })

      const paymentMethods =
        yield* btcPayServerService.getInvoicePaymentMethods({
          invoiceId: createInvoiceResponse.id,
          storeId: createInvoiceResponse.storeId,
        })

      const paymentMethod = Array.findFirst(
        paymentMethods,
        (method) => method.paymentMethodId === req.payload.paymentMethod
      )

      if (Option.isNone(paymentMethod))
        return yield* Effect.fail(
          new CreateInvoiceError({
            cause: new Error(
              `No ${req.payload.paymentMethod} payment method found`
            ),
            message: `No ${req.payload.paymentMethod} payment method found`,
          })
        )

      yield* updateInvoiceStateWebhookService.createOrUpdateInvoiceState({
        invoiceId: Schema.decodeSync(InvoiceId)(createInvoiceResponse.id),
        type: 'InvoiceCreated',
      })

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
    }).pipe(Effect.withSpan('createInvoiceHandler'), makeEndpointEffect)
)
