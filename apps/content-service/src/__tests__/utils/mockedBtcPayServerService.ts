import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  type InvoiceId,
  type StoreId,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, Layer} from 'effect'
import {BtcPayServerService} from '../../utils/donations'

export const dummyInvoiceResponse = {
  id: 'inv_abc123456' as InvoiceId,
  storeId: 'store_xyz7890' as StoreId,
  currency: 'BTC',
  amount: '0.005',
  type: 'Standard' as const,
  checkoutLink: 'https://btcpay.example.com/i/inv_abc123456',
  createdTime: 1720403200000 as UnixMilliseconds, // Unix ms timestamp
  expirationTime: 1720404100000 as UnixMilliseconds,
  monitoringExpiration: 1720404700000 as UnixMilliseconds,
  status: 'New' as const,
  additionalStatus: 'WaitingPayment',
  availableStatusesForManualMarking: ['Paid', 'Invalid'],
  archived: false,
  metadata: {
    orderId: 'order-001',
    orderUrl: 'https://example.com/order/001',
    itemDesc: 'Bitcoin T-shirt',
    posData: {ref: 'custom_ref'},
    receiptData: {thankYouNote: 'Thanks for shopping!'},
  },
  checkout: {
    speedPolicy: 'MediumSpeed' as const,
    paymentMethods: ['BTC-LN', 'BTC-CHAIN'] as const,
    defaultPaymentMethod: 'BTC-CHAIN' as const,
    lazyPaymentMethods: null,
    expirationMinutes: 15,
    monitoringMinutes: 30,
    redirectUrl: null,
    redirectAutomatically: false,
    defaultLanguage: null,
  },
  receipt: {
    enabled: true,
    showQr: true,
    showPayments: true,
  },
}

export const dummyInvoicePaymentMethods = [
  {
    activated: true,
    destination: 'bc1qexampledestinationaddress00000000000000000',
    paymentLink: 'lightning:lnbc1examplepaymentlink',
    rate: '60000',
    paymentMethodPaid: '0.003',
    totalPaid: '0.003',
    due: '0.002',
    amount: '0.005',
    paymentMethodFee: '0.0001',
    payments: ['payment1', 'payment2'],
    paymentMethodId: 'BTC-LN',
    additionalData: {
      paymentHash: 'abc123def456ghi789',
      preimage: 'def456ghi789abc123',
      invoiceId: 'inv_abc123',
      nodeInfo: '033abcdeffeednodeonionaddress',
    },
    currency: 'BTC' as const,
  },
] as const

export const mockedCreateInvoice = jest.fn(() =>
  Effect.succeed(dummyInvoiceResponse)
)
export const mockedGetInvoice = jest.fn(() =>
  Effect.succeed(dummyInvoiceResponse)
)
export const mockedGetInvoicePaymentMethods = jest.fn(() =>
  Effect.succeed(dummyInvoicePaymentMethods)
)

export const mockedBtcPayServerService = Layer.succeed(BtcPayServerService, {
  createInvoice: mockedCreateInvoice,
  getInvoice: mockedGetInvoice,
  getInvoicePaymentMethods: mockedGetInvoicePaymentMethods,
})
