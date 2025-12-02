import {HttpsUrlString} from '@vexl-next/domain/src/utility/HttpsUrlString.brand'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {UuidE} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Schema} from 'effect'

export const Speaker = Schema.Struct({
  name: Schema.String,
  linkToSocials: Schema.optionalWith(Schema.String, {as: 'Option'}),
  imageUrl: Schema.optionalWith(Schema.String, {as: 'Option'}),
})
export type Speaker = typeof Speaker.Type

export const EventId = Schema.String.pipe(Schema.brand('EventId'))
export type EventId = typeof EventId.Type

export const Event = Schema.Struct({
  id: EventId,
  startDate: Schema.Date,
  endDate: Schema.optionalWith(Schema.Date, {as: 'Option'}),
  link: Schema.String,
  name: Schema.String,
  venue: Schema.String,
  speakers: Schema.Array(Speaker),
  goldenGlasses: Schema.optionalWith(Schema.Boolean, {default: () => false}),
})
export type Event = typeof Event.Type

export const EventsResponse = Schema.Struct({
  events: Schema.Array(Event),
})
export type EventsResponse = typeof EventsResponse.Type

export const BlogId = Schema.String.pipe(Schema.brand('BlogId'))
export type BlogId = typeof BlogId.Type

export const BlogSlug = Schema.String.pipe(Schema.brand('BlogSlug'))
export type BlogSlug = typeof BlogSlug.Type

export const BlogArticlePreview = Schema.Struct({
  id: BlogId,
  title: Schema.String,
  slug: BlogSlug,
  teaserText: Schema.optionalWith(Schema.String, {as: 'Option'}),
  mainImage: Schema.optionalWith(UriStringE, {as: 'Option'}),
  link: Schema.String,
  publishedOn: Schema.DateFromString,
})
export type BlogArticlePreview = typeof BlogArticlePreview.Type

export const BlogsArticlesResponse = Schema.Struct({
  articles: Schema.Array(BlogArticlePreview),
})
export type BlogsArticlesResponse = typeof BlogsArticlesResponse.Type

export class InvalidTokenError extends Schema.TaggedError<InvalidTokenError>(
  'InvalidTokenError'
)('InvalidTokenError', {
  status: Schema.optionalWith(Schema.Literal(401), {default: () => 401}),
}) {}

export const ClearEventsCacheRequest = Schema.Struct({
  token: Schema.String,
})

export const VexlBotNews = Schema.Struct({
  id: UuidE,
  content: Schema.String,
  type: Schema.Literal('info', 'warning'),
  action: Schema.Struct({
    text: Schema.String,
    url: HttpsUrlString,
  }).pipe(Schema.optionalWith({as: 'Option'})),
  cancelForever: Schema.Boolean,
  bubbleOrigin: Schema.optionalWith(
    Schema.Struct({
      title: Schema.String,
      subtitle: Schema.String,
    }),
    {as: 'Option'}
  ),
  cancelable: Schema.Boolean,
})
export type VexlBotNews = typeof VexlBotNews.Type

export const FullScreenWarning = Schema.Struct({
  id: UuidE,
  type: Schema.Literal('RED', 'YELLOW', 'GREEN'),
  title: Schema.String,
  description: Schema.String,
  cancelForever: Schema.Boolean,
  action: Schema.Struct({
    text: Schema.String,
    url: HttpsUrlString,
  }).pipe(Schema.optionalWith({as: 'Option'})),
  cancelable: Schema.Boolean,
})
export type FullScreenWarning = typeof FullScreenWarning.Type

export const NewsAndAnnouncementsResponse = Schema.Struct({
  vexlBotNews: Schema.Array(VexlBotNews),
  fullScreenWarning: Schema.optionalWith(FullScreenWarning, {as: 'Option'}),
})
export type NewsAndAnnouncementsResponse =
  typeof NewsAndAnnouncementsResponse.Type

export class CreateInvoiceError extends Schema.TaggedError<CreateInvoiceError>(
  'CreateInvoiceError'
)('CreateInvoiceError', {
  cause: Schema.Unknown,
  message: Schema.String,
  status: Schema.optionalWith(Schema.Literal(400), {
    default: () => 400,
  }),
}) {}

export class InvoiceNotFoundError extends Schema.TaggedError<InvoiceNotFoundError>(
  'InvoiceNotFoundError'
)('InvoiceNotFoundError', {
  cause: Schema.Unknown,
  message: Schema.String,
  status: Schema.Literal(400),
}) {}

export class GetInvoiceGeneralError extends Schema.TaggedError<GetInvoiceGeneralError>(
  'GetInvoiceGeneralError'
)('GetInvoiceGeneralError', {
  cause: Schema.Unknown,
  message: Schema.String,
  status: Schema.Literal(502),
}) {}

export class UpdateInvoiceWebhookError extends Schema.TaggedError<UpdateInvoiceWebhookError>(
  'UpdateInvoiceWebhookError'
)('UpdateInvoiceWebhookError', {
  cause: Schema.Unknown,
  message: Schema.String,
  status: Schema.Literal(400),
}) {}

export class GetInvoicePaymentMethodsGeneralError extends Schema.TaggedError<GetInvoicePaymentMethodsGeneralError>(
  'GetInvoicePaymentMethodsGeneralError'
)('GetInvoicePaymentMethodsGeneralError', {
  cause: Schema.Unknown,
  message: Schema.String,
  status: Schema.Literal(502),
}) {}

export const InvoicePaymentMethod = Schema.Literal(
  'BTC-CHAIN',
  'BTC-LN',
  'BTC-LNURL'
)
export type InvoicePaymentMethod = typeof InvoicePaymentMethod.Type
export const CreateInvoiceRequest = Schema.Struct({
  amount: Schema.Number,
  currency: Schema.Literal('EUR'),
  paymentMethod: InvoicePaymentMethod,
})
export type CreateInvoiceRequest = typeof CreateInvoiceRequest.Type

export const InvoiceId = Schema.String.pipe(Schema.brand('InvoiceId'))
export type InvoiceId = typeof InvoiceId.Type

export const StoreId = Schema.String.pipe(Schema.brand('StoreId'))
export type StoreId = typeof StoreId.Type

export const PaymentLink = Schema.String.pipe(Schema.brand('PaymentLink'))
export type PaymentLink = typeof PaymentLink.Type

export const InvoiceStatus = Schema.Literal(
  'New',
  'Expired',
  'Paid',
  'Complete',
  'Confirmed',
  'Processing',
  'Invalid',
  'Settled'
)
export type InvoiceStatus = typeof InvoiceStatus.Type

export const CreateInvoiceResponse = Schema.Struct({
  invoiceId: InvoiceId,
  storeId: StoreId,
  fiatAmount: Schema.String,
  btcAmount: Schema.String,
  currency: Schema.Literal('EUR'),
  exchangeRate: Schema.String,
  paymentLink: PaymentLink,
  status: InvoiceStatus,
  paymentMethod: InvoicePaymentMethod,
  createdTime: UnixMillisecondsE,
  expirationTime: UnixMillisecondsE,
})
export type CreateInvoiceResponse = typeof CreateInvoiceResponse.Type

export const GetInvoiceRequest = Schema.Struct({
  invoiceId: InvoiceId,
  storeId: StoreId,
})
export type GetInvoiceRequest = typeof GetInvoiceRequest.Type

export const GetInvoiceResponse = Schema.Struct({
  invoiceId: InvoiceId,
  storeId: StoreId,
  status: InvoiceStatus,
})
export type GetInvoiceResponse = typeof GetInvoiceResponse.Type

export const InvoiceStatusType = Schema.Literal(
  'InvoiceCreated',
  'InvoiceReceivedPayment',
  'InvoicePaymentSettled',
  'InvoiceProcessing',
  'InvoiceExpired',
  'InvoiceSettled',
  'InvoiceInvalid'
)
export type InvoiceStatusType = typeof InvoiceStatusType.Type

// states of success invoice
// InvoiceCreated -> InvoicePaymentSettled -> InvoiceReceivedPayment ->
// -> InvoiceProcessing -> InvoiceSettled
export const statusTypeToStatusMap: Record<InvoiceStatusType, InvoiceStatus> = {
  InvoiceCreated: 'New',
  InvoicePaymentSettled: 'Processing',
  InvoiceReceivedPayment: 'Processing',
  InvoiceProcessing: 'Processing',
  InvoiceSettled: 'Settled',
  InvoiceExpired: 'Expired',
  InvoiceInvalid: 'Invalid',
}

export const statusToStatusTypeMap: Record<InvoiceStatus, InvoiceStatusType> = {
  New: 'InvoiceCreated',
  Paid: 'InvoiceReceivedPayment',
  Processing: 'InvoiceProcessing',
  Complete: 'InvoiceReceivedPayment',
  Confirmed: 'InvoicePaymentSettled',
  Settled: 'InvoiceSettled',
  Expired: 'InvoiceExpired',
  Invalid: 'InvoiceInvalid',
}

export const UpdateInvoiceStatusWebhookRequest = Schema.Struct({
  deliveryId: Schema.optionalWith(Schema.String, {
    as: 'Option',
  }),
  webhookId: Schema.optionalWith(Schema.String, {
    as: 'Option',
  }),
  originalDeliveryId: Schema.optionalWith(Schema.String, {
    as: 'Option',
  }),
  isRedelivery: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  type: InvoiceStatusType,
  timestamp: UnixMillisecondsE,
  partiallyPaid: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  storeId: StoreId,
  invoiceId: InvoiceId,
  metadata: Schema.Struct({
    orderId: Schema.optionalWith(Schema.String, {
      as: 'Option',
    }),
    itemDesc: Schema.optionalWith(Schema.String, {
      as: 'Option',
    }),
    orderUrl: Schema.optionalWith(Schema.String, {
      as: 'Option',
    }),
  }),
})
export type UpdateInvoiceStatusWebhookRequest =
  typeof UpdateInvoiceStatusWebhookRequest.Type

export const GetInvoiceStatusTypeRequest = Schema.Struct({
  invoiceId: InvoiceId,
  storeId: StoreId,
})
export type GetInvoiceStatusTypeRequest =
  typeof GetInvoiceStatusTypeRequest.Type

export const GetInvoiceStatusTypeResponse = Schema.Struct({
  invoiceId: InvoiceId,
  statusType: InvoiceStatusType,
})
export type GetInvoiceStatusTypeResponse =
  typeof GetInvoiceStatusTypeResponse.Type
