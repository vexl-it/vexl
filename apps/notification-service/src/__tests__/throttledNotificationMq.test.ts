import {VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Schema} from 'effect/index'
import {processThrottledNotificationsJobId} from '../services/ThrottledPushNotificationService/services/ThrottledNotificationJobId'

describe('processThrottledNotificationsJobId', () => {
  it('builds a BullMQ-safe job ID without Redis key separators', () => {
    const token = Schema.decodeSync(VexlNotificationTokenSecret)(
      'vexl_nt_secret_test'
    )

    const jobId = processThrottledNotificationsJobId(token)

    expect(jobId).toBe('process-throttled-notifications-vexl_nt_secret_test')
    expect(jobId).not.toContain(':')
  })
})
