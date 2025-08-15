import {UuidE} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Schema} from 'effect'

export const ReportNotificationInteractionRequest = Schema.Struct({
  uuid: UuidE,
  count: Schema.NumberFromString.pipe(Schema.positive()),
  notificationType: Schema.Literal('Chat', 'Network'),
  type: Schema.Literal(
    'ChatMessageReceived',
    'BackgroundMessageReceived',
    'NewConnectionsReceived',
    'UINotificationReceived'
  ),
})

export type ReportNotificationInteractionRequest =
  typeof ReportNotificationInteractionRequest.Type
