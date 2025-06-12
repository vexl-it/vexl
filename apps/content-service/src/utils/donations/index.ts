import {
  CreateInvoiceError,
  type CreateInvoiceRequest,
  type GetInvoiceErrors,
  GetInvoiceGeneralError,
  type GetInvoicePaymentMethodsErrors,
  GetInvoicePaymentMethodsGeneralError,
  InvoiceNotFoundError,
} from '@vexl-next/rest-api/src/services/content/contracts'
import axios from 'axios'
import {Context, Effect, Layer} from 'effect'
import {nanoid} from 'nanoid'
import urlJoin from 'url-join'
import {
  btcPayServerApiKeyConfig,
  btcPayServerStoreIdConfig,
  btcPayServerUrlConfig,
} from '../../configs'
import {
  type CreateInvoiceRequest as CreateInvoiceRequestInternal,
  type GetInvoicePaymentMethodsRequest,
  type GetInvoiceRequest,
  type InvoicePaymentMethodsResponseInternal,
  type InvoiceResponseInternal,
} from './domain'

const URL_API = 'api'
const URL_V1 = 'v1'
const URL_STORES = 'stores'
const URL_INVOICES = 'invoices'
const URL_PAYMENT_METHODS = 'payment-methods'

const ORDER_URL =
  'https://pay.satoshilabs.com/apps/3r54iLzBDuB99zDV8s4SQTy3cvua/pos'
const INVOICE_DESC = 'Donation to Vexl Foundation'

// ⚠️⚠️
// ⚠️ Vexl app uses only small part of information from these EPs, so all the types may not be correct.
// ⚠️ To use full functionality in the future if needed pls see:
// ⚠️ https://docs.btcpayserver.org/API/Greenfield/v1/
// ⚠️⚠️

export interface BtcPayServerOperations {
  createInvoice: (
    body: CreateInvoiceRequest
  ) => Effect.Effect<InvoiceResponseInternal, CreateInvoiceError>
  getInvoice: (
    params: GetInvoiceRequest
  ) => Effect.Effect<InvoiceResponseInternal, GetInvoiceErrors>
  getInvoicePaymentMethods: (
    params: GetInvoicePaymentMethodsRequest
  ) => Effect.Effect<
    InvoicePaymentMethodsResponseInternal,
    GetInvoicePaymentMethodsErrors
  >
}

function createInvoiceInternal({
  btcPayServerUrl,
  storeId,
  apiKey,
  amount,
  currency,
  paymentMethod,
}: {
  btcPayServerUrl: string
  storeId: string
  apiKey: string
  amount: string
  currency: string
  paymentMethod: 'BTC-CHAIN' | 'BTC-LN'
}): Effect.Effect<InvoiceResponseInternal, CreateInvoiceError> {
  const url = urlJoin(
    btcPayServerUrl,
    URL_API,
    URL_V1,
    URL_STORES,
    storeId,
    URL_INVOICES
  )
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'token ' + apiKey,
  }

  const body = {
    amount,
    currency,
    additionalSearchTerms: [
      'donation',
      'vexlFoundation',
      'donationApp',
      'donationInvoice',
    ],
    metadata: {
      orderId: `vexl-donation_${nanoid()}`,
      orderUrl: ORDER_URL,
      itemDesc: INVOICE_DESC,
    },
    checkout: {
      redirectUrl: ORDER_URL,
      redirectAutomatically: true,
      expirationMinutes: 60,
      monitoringMinutes: 60,
      speedPolicy: 'MediumSpeed',
      paymentMethods: [paymentMethod],
      defaultPaymentMethod: paymentMethod,
      defaultLanguage: null,
      lazyPaymentMethods: null,
    },
  } satisfies CreateInvoiceRequestInternal

  return Effect.tryPromise({
    try: async () => {
      const resp = await axios.post(url, body, {
        headers,
      })

      return resp
    },
    catch: (e: any) => {
      return new CreateInvoiceError({
        cause: e,
        message: e.message,
      })
    },
  }).pipe(
    Effect.map((response) => {
      return response.data
    }),
    Effect.withSpan('createInvoiceHandler', {
      attributes: {url, body, btcPayServerUrl, storeId},
    })
  )
}

function getInvoiceInternal({
  btcPayServerUrl,
  apiKey,
  storeId,
  invoiceId,
}: {
  btcPayServerUrl: string
  apiKey: string
  storeId: string
  invoiceId: string
}): Effect.Effect<InvoiceResponseInternal, GetInvoiceErrors> {
  const url = urlJoin(
    btcPayServerUrl,
    URL_API,
    URL_V1,
    URL_STORES,
    storeId,
    URL_INVOICES,
    invoiceId
  )
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'token ' + apiKey,
  }

  return Effect.tryPromise({
    try: async () => {
      const resp = await axios.get(url, {
        headers,
      })

      return resp
    },
    catch: (e: any) => {
      if (e.response?.status === 404) {
        return new InvoiceNotFoundError({
          cause: e,
          message: 'Invoice not found',
          status: 404,
        })
      }

      return new GetInvoiceGeneralError({
        cause: e,
        message: e.message,
        status: 500,
      })
    },
  }).pipe(
    Effect.map((response) => {
      return response.data
    }),
    Effect.withSpan('getInvoiceHandler', {
      attributes: {url, btcPayServerUrl, storeId, invoiceId},
    })
  )
}

function getInvoicePaymentMethodsInternal({
  btcPayServerUrl,
  apiKey,
  storeId,
  invoiceId,
}: {
  btcPayServerUrl: string
  apiKey: string
  storeId: string
  invoiceId: string
}): Effect.Effect<
  InvoicePaymentMethodsResponseInternal,
  GetInvoicePaymentMethodsErrors
> {
  const url = urlJoin(
    btcPayServerUrl,
    URL_API,
    URL_V1,
    URL_STORES,
    storeId,
    URL_INVOICES,
    invoiceId,
    URL_PAYMENT_METHODS
  )
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'token ' + apiKey,
  }

  return Effect.tryPromise({
    try: async () => {
      const resp = await axios.get(url, {
        headers,
      })

      return resp
    },
    catch: (e: any) => {
      if (e.response?.status === 404) {
        return new InvoiceNotFoundError({
          cause: e,
          message: 'Invoice not found',
          status: 404,
        })
      }

      return new GetInvoicePaymentMethodsGeneralError({
        cause: e,
        message: e.message,
        status: 500,
      })
    },
  }).pipe(
    Effect.map((response) => {
      return response.data
    }),
    Effect.withSpan('getInvoicePaymentMethodsHandler', {
      attributes: {url, btcPayServerUrl, storeId, invoiceId},
    })
  )
}

export class BtcPayServerService extends Context.Tag('BtcPayServerService')<
  BtcPayServerService,
  BtcPayServerOperations
>() {
  static readonly Live = Layer.effect(
    BtcPayServerService,
    Effect.gen(function* (_) {
      const btcPayServerUrl = yield* _(btcPayServerUrlConfig)
      const btcPayServerApiKey = yield* _(btcPayServerApiKeyConfig)
      const btcPayServerStoreId = yield* _(btcPayServerStoreIdConfig)

      const toReturn = {
        createInvoice: ({
          amount,
          currency,
          paymentMethod,
        }: CreateInvoiceRequest) =>
          createInvoiceInternal({
            btcPayServerUrl,
            storeId: btcPayServerStoreId,
            apiKey: btcPayServerApiKey,
            amount: amount.toString(),
            currency,
            paymentMethod,
          }),
        getInvoice: ({invoiceId, storeId}: GetInvoiceRequest) =>
          getInvoiceInternal({
            btcPayServerUrl,
            apiKey: btcPayServerApiKey,
            storeId,
            invoiceId,
          }),
        getInvoicePaymentMethods: ({
          storeId,
          invoiceId,
        }: GetInvoicePaymentMethodsRequest) =>
          getInvoicePaymentMethodsInternal({
            btcPayServerUrl,
            apiKey: btcPayServerApiKey,
            storeId,
            invoiceId,
          }),
      }

      return toReturn
    })
  )
}
