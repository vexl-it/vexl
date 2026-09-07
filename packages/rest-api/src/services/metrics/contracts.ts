import {NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {BooleanFromString} from '@vexl-next/generic-utils/src/effect-helpers/BooleanFromString'
import {NumberFromString} from '@vexl-next/generic-utils/src/effect-helpers/NumberFromString'
import {Schema} from 'effect'

export const ReportNotificationInteractionRequest = Schema.Struct({
  uuid: Uuid,
  count: NumberFromString.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
  notificationType: Schema.Literals(['Chat', 'Network']),
  trackingId: Schema.optional(NotificationTrackingId),
  notificationsEnabled: Schema.optional(BooleanFromString),
  backgroundTaskEnabled: Schema.optional(BooleanFromString),
  isVisible: Schema.optional(BooleanFromString),
  systemNotificationSent: Schema.optional(BooleanFromString),
  type: Schema.Literals([
    'ChatMessageReceived',
    'BackgroundMessageReceived',
    'NewConnectionsReceived',
    'UINotificationReceived',
  ]),
})

export type ReportNotificationInteractionRequest =
  typeof ReportNotificationInteractionRequest.Type
