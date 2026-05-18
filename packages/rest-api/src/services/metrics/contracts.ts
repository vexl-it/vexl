import {NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Schema} from 'effect'

export const FrontendEvent = Schema.Literal(
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

export const ReportFrontendEventRequest = Schema.Struct({
  analyticsUuid: Uuid,
  event: FrontendEvent,
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
