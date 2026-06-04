import {VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Schema} from 'effect/index'
import {notificationTokenOperationalId} from '../services/ThrottledPushNotificationService/services/NotificationTokenOperationalId'
import {processThrottledNotificationsJobId} from '../services/ThrottledPushNotificationService/services/ThrottledNotificationJobId'

describe('notificationTokenOperationalId', () => {
  it('builds a stable non-raw operational id', () => {
    const token = Schema.decodeSync(VexlNotificationTokenSecret)(
      'vexl_nt_secret_test'
    )

    const firstId = notificationTokenOperationalId(token)
    const secondId = notificationTokenOperationalId(token)

    expect(firstId).toBe(secondId)
    expect(firstId).not.toContain(token)
    expect(firstId).not.toContain(':')
  })
})

describe('processThrottledNotificationsJobId', () => {
  it('builds a stable BullMQ-safe job ID without the raw token', () => {
    const token = Schema.decodeSync(VexlNotificationTokenSecret)(
      'vexl_nt_secret_test'
    )

    const jobId = processThrottledNotificationsJobId(token)

    expect(jobId).toBe(
      `process-throttled-notifications-${notificationTokenOperationalId(token)}`
    )
    expect(jobId).not.toContain(token)
    expect(jobId).not.toContain(':')
  })
})
