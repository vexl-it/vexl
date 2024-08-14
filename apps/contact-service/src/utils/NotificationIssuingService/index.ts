import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Context, type Effect} from 'effect'

export interface NotificationIssuingOperations {
  sendBackgroundNotificationHandleBadToken: (args: {
    type: string // TODO brand
    token: FcmToken
  }) => Effect.Effect<void, never, never>
}

export class NotificationIssuingService extends Context.Tag(
  'NotificationIssuingService'
)<NotificationIssuingService, NotificationIssuingOperations>() {}
