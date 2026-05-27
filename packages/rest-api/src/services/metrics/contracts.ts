import {NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Schema} from 'effect'

export const FrontendEvent = Schema.Literal(
  'appOpened',
  'sessionStarted',
  'marketplaceOpened',
  'offerSearchPerformed',
  'noOffersFound',
  'offerViewed',
  'offerCreateStarted',
  'offerPaused',
  'offerResumed',
  'offerDeleted',
  'chatCreated',
  'chatOpened',
  'offerRequested',
  'offerRequestDenied',
  'offerRequestAccepted',
  'offerRerequested',
  'offerRequestAcceptedByOtherSide',
  'chatClosed',
  'appStartedFirstTime',
  'loginFinished',
  'offerCreated'
)
export type FrontendEvent = typeof FrontendEvent.Type

export const FrontendEventAttributes = Schema.Record({
  key: Schema.String,
  value: Schema.Union(Schema.String, Schema.Number, Schema.Boolean),
})
export type FrontendEventAttributes = typeof FrontendEventAttributes.Type

export const ReportFrontendEventRequest = Schema.Struct({
  id: Uuid,
  analyticsId: Uuid,
  event: FrontendEvent,
  attributes: Schema.optional(FrontendEventAttributes),
  date: Schema.DateFromString,
})
export type ReportFrontendEventRequest = typeof ReportFrontendEventRequest.Type

export const ReportNotificationInteractionRequest = Schema.Struct({
  uuid: Uuid,
  count: Schema.NumberFromString.pipe(Schema.greaterThanOrEqualTo(0)),
  notificationType: Schema.Literal('Chat', 'Network'),
  trackingId: Schema.optional(NotificationTrackingId),
  notificationsEnabled: Schema.optional(Schema.BooleanFromString),
  backgroundTaskEnabled: Schema.optional(Schema.BooleanFromString),
  isVisible: Schema.optional(Schema.BooleanFromString),
  systemNotificationSent: Schema.optional(Schema.BooleanFromString),
  type: Schema.Literal(
    'ChatMessageReceived',
    'BackgroundMessageReceived',
    'NewConnectionsReceived',
    'UINotificationReceived'
  ),
})

export type ReportNotificationInteractionRequest =
  typeof ReportNotificationInteractionRequest.Type
