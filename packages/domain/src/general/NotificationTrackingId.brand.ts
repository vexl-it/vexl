import {Schema} from 'effect'
import {generateUuid} from '../utility/Uuid.brand'

export const NotificationTrackingId = Schema.String.pipe(
  Schema.brand('NotificationTrackingId')
)
export type NotificationTrackingId = typeof NotificationTrackingId.Type

export const createNotificationTrackingId = (): NotificationTrackingId =>
  Schema.decodeSync(NotificationTrackingId)(generateUuid())
