export const createFirebaseNotificationRequest = (
  data: Record<string, string>
): {
  android: {
    priority: 'high'
  }
  apns: {
    payload: {
      aps: {
        contentAvailable: true
      }
    }
  }
  data: Record<string, string>
} => ({
  android: {
    priority: 'high' as const,
  },
  apns: {
    payload: {aps: {contentAvailable: true}},
  },
  data,
})
