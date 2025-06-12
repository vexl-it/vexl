import {
  CreateInvoiceError,
  CreateInvoiceErrors,
  type CreateInvoiceResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {CreateInvoiceEndpoint} from '@vexl-next/rest-api/src/services/content/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {BtcPayServerService} from '../../utils/donations'

export const createInvoiceHandler = Handler.make(CreateInvoiceEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const btcPayServerService = yield* _(BtcPayServerService)

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

      const toReturn = {
        invoiceId: createInvoiceResponse.id,
        storeId: createInvoiceResponse.storeId,
        paymentLink: paymentMethod.value.paymentLink,
        exchangeRate: paymentMethod.value.rate,
        btcAmount: paymentMethod.value.amount,
        fiatAmount: createInvoiceResponse.amount,
        currency: 'EUR',
      } satisfies CreateInvoiceResponse

      return toReturn
    }),
    CreateInvoiceErrors
  )
)
