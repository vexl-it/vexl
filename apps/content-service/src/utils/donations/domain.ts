import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'

// Vexl will use only few of the fields, if other are needed,
// check the BTCPayServer Greenfield API docs
export const CreateInvoiceRequest = Schema.Struct({
  currency: Schema.String,
  amount: Schema.String,
  metadata: Schema.optional(
    Schema.Struct({
      orderId: Schema.String,
      orderUrl: Schema.String,
      itemDesc: Schema.String,
      posData: Schema.optional(Schema.Any),
      receiptData: Schema.optional(Schema.Any),
    })
  ),
  checkout: Schema.optional(
    Schema.Struct({
      speedPolicy: Schema.Literal(
        'HighSpeed',
        'MediumSpeed',
        'LowMediumSpeed',
        'LowSpeed'
      ),
      paymentMethods: Schema.optionalWith(
        Schema.Array(Schema.Literal('BTC-LN', 'BTC-CHAIN', 'BTC-LNURL')),
        {
          default: () => [],
        }
      ),
      defaultPaymentMethod: Schema.Literal('BTC-LN', 'BTC-CHAIN', 'BTC-LNURL'),
      lazyPaymentMethods: Schema.NullOr(Schema.String),
      expirationMinutes: Schema.Int,
      monitoringMinutes: Schema.Int,
      redirectUrl: Schema.NullOr(Schema.String),
      redirectAutomatically: Schema.optionalWith(Schema.Boolean, {
        default: () => false,
      }),
      // BTCPayServer Greenfield API allows this to be null, but we use it as a string
      defaultLanguage: Schema.NullOr(Schema.String),
    })
  ),
  receipt: Schema.optional(
    Schema.Struct({
      enabled: Schema.Boolean,
      showQr: Schema.optionalWith(Schema.Boolean, {default: () => false}),
      showPayments: Schema.optionalWith(Schema.Boolean, {default: () => false}),
    })
  ),
  additionalSearchTerms: Schema.optional(Schema.Array(Schema.String)),
})
export type CreateInvoiceRequest = typeof CreateInvoiceRequest.Type

// Vexl will use only few of the fields, if other are needed,
// check the BTCPayServer Greenfield API docs
export const InvoiceResponseInternal = Schema.Struct({
  id: Schema.String,
  storeId: Schema.String,
  currency: Schema.String,
  amount: Schema.String,
  type: Schema.Literal('Standard'),
  checkoutLink: Schema.String,
  createdTime: UnixMillisecondsE,
  expirationTime: UnixMillisecondsE,
  monitoringExpiration: UnixMillisecondsE,
  status: Schema.Literal(
    'New',
    'Expired',
    'Paid',
    'Complete',
    'Confirmed',
    'Processing',
    'Invalid',
    'Settled'
  ),
  additionalStatus: Schema.String,
  availableStatusesForManualMarking: Schema.Array(Schema.String),
  archived: Schema.Boolean,
  metadata: Schema.optional(
    Schema.Struct({
      orderId: Schema.String,
      orderUrl: Schema.String,
      itemDesc: Schema.String,
      posData: Schema.optional(Schema.Any),
      receiptData: Schema.optional(Schema.Any),
    })
  ),
  checkout: Schema.optional(
    Schema.Struct({
      speedPolicy: Schema.Literal(
        'HighSpeed',
        'MediumSpeed',
        'LowMediumSpeed',
        'LowSpeed'
      ),
      paymentMethods: Schema.optionalWith(
        Schema.Array(Schema.Literal('BTC-LN', 'BTC-CHAIN', 'BTC-LNURL')),
        {
          default: () => [],
        }
      ),
      defaultPaymentMethod: Schema.Literal('BTC-LN', 'BTC-CHAIN', 'BTC-LNURL'),
      lazyPaymentMethods: Schema.NullOr(Schema.String),
      expirationMinutes: Schema.Int,
      monitoringMinutes: Schema.Int,
      redirectUrl: Schema.NullOr(Schema.String),
      redirectAutomatically: Schema.optionalWith(Schema.Boolean, {
        default: () => false,
      }),
      defaultLanguage: Schema.NullOr(Schema.String),
    })
  ),
  receipt: Schema.optional(
    Schema.Struct({
      enabled: Schema.Boolean,
      showQr: Schema.optionalWith(Schema.Boolean, {default: () => false}),
      showPayments: Schema.optionalWith(Schema.Boolean, {default: () => false}),
    })
  ),
})
export type InvoiceResponseInternal = typeof InvoiceResponseInternal.Type

export const GetInvoiceRequest = Schema.Struct({
  invoiceId: Schema.String,
  storeId: Schema.String,
})
export type GetInvoiceRequest = typeof GetInvoiceRequest.Type

export const GetInvoicePaymentMethodsRequest = Schema.Struct({
  invoiceId: Schema.String,
  storeId: Schema.String,
})
export type GetInvoicePaymentMethodsRequest =
  typeof GetInvoicePaymentMethodsRequest.Type

export const InvoicePaymentMethodsResponseInternal = Schema.Array(
  Schema.Struct({
    activated: Schema.Boolean,
    destination: Schema.String,
    paymentLink: Schema.String,
    rate: Schema.String,
    paymentMethodPaid: Schema.String,
    totalPaid: Schema.String,
    due: Schema.String,
    amount: Schema.String,
    paymentMethodFee: Schema.String,
    payments: Schema.Array(Schema.String),
    paymentMethodId: Schema.Literal('BTC-LN', 'BTC-CHAIN', 'BTC-LNURL'),
    additionalData: Schema.Struct({
      paymentHash: Schema.String,
      preimage: Schema.String,
      invoiceId: Schema.String,
      nodeInfo: Schema.String,
    }),
    currency: Schema.String,
  })
)
export type InvoicePaymentMethodsResponseInternal =
  typeof InvoicePaymentMethodsResponseInternal.Type
