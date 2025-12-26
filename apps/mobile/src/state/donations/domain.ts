import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  InvoiceId,
  InvoicePaymentMethod,
  InvoiceStatus,
  PaymentLink,
  StoreId,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Schema} from 'effect'

export const MyDonation = Schema.Struct({
  invoiceId: InvoiceId,
  storeId: StoreId,
  paymentMethod: InvoicePaymentMethod,
  status: InvoiceStatus,
  exchangeRate: Schema.String,
  paymentLink: PaymentLink,
  fiatAmount: Schema.String,
  btcAmount: Schema.String,
  currency: Schema.Literal('EUR'),
  createdTime: UnixMilliseconds,
  expirationTime: UnixMilliseconds,
})
export type MyDonation = typeof MyDonation.Type
