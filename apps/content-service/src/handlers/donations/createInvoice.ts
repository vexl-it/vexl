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
          amount: req.body.amount.toString(),
          currency: req.body.currency,
        })
      )

      const paymentMethods = yield* _(
        btcPayServerService.getInvoicePaymentMethods({
          invoiceId: createInvoiceResponse.id,
          storeId: createInvoiceResponse.storeId,
        })
      )

      const lightningPaymentMethod = Array.findFirst(
        paymentMethods,
        (method) => method.paymentMethodId === 'BTC-LN'
      )

      if (Option.isNone(lightningPaymentMethod))
        return yield* _(
          Effect.fail(
            new CreateInvoiceError({
              cause: new Error('No BTC-LN payment method found'),
              message: 'No BTC-LN payment method found',
            })
          )
        )

      const toReturn = {
        invoiceId: createInvoiceResponse.id,
        storeId: createInvoiceResponse.storeId,
        paymentLink: lightningPaymentMethod.value.paymentLink,
        exchangeRate: lightningPaymentMethod.value.rate,
        btcAmount: lightningPaymentMethod.value.amount,
        fiatAmount: createInvoiceResponse.amount,
        currency: 'EUR',
      } satisfies CreateInvoiceResponse

      return toReturn
    }),
    CreateInvoiceErrors
  )
)
