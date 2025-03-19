import {type BaseMessage} from 'firebase-admin/messaging'

export const createFirebaseNotificationRequest = (
  data: Record<string, string>,
  notification?:
    | {
        body: string
        title: string
        subtitle?: string | undefined
      }
    | undefined
): BaseMessage =>
  notification
    ? {
        data,
        notification: {
          body: notification.body,
          title: notification.title,
        },
      }
    : {
        android: {
          priority: 'high' as const,
        },
        apns: {
          payload: {aps: {contentAvailable: true}},
        },
        data,
      }
