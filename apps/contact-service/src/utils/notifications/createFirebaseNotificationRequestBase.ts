export const createFirebaseNotificationRequest = (
  type: string
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
  data: {
    type: string
  }
} => ({
  android: {
    priority: 'high' as const,
  },
  apns: {
    payload: {aps: {contentAvailable: true}},
  },
  data: {
    type,
  },
})
