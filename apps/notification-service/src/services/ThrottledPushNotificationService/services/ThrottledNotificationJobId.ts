import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'

export const processThrottledNotificationsJobId = (
  token: VexlNotificationTokenSecret
): string => `process-throttled-notifications-${token}`
