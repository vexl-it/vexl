import {NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {UuidE} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Schema} from 'effect'

export const ReportNotificationInteractionRequest = Schema.Struct({
  uuid: UuidE,
  count: Schema.NumberFromString.pipe(Schema.greaterThanOrEqualTo(0)),
  notificationType: Schema.Literal('Chat', 'Network'),
  trackingId: Schema.optional(NotificationTrackingId),
  notificationsEnabled: Schema.optional(Schema.BooleanFromString),
  backgroundTaskEnabled: Schema.optional(Schema.BooleanFromString),
  type: Schema.Literal(
    'ChatMessageReceived',
    'BackgroundMessageReceived',
    'NewConnectionsReceived',
    'UINotificationReceived'
  ),
})

export type ReportNotificationInteractionRequest =
  typeof ReportNotificationInteractionRequest.Type
