import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {notificationTokenOperationalId} from './NotificationTokenOperationalId'

export const processThrottledNotificationsJobId = (
  token: VexlNotificationTokenSecret
): string =>
  `process-throttled-notifications-${notificationTokenOperationalId(token)}`
