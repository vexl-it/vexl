import {
  BackgroundNotificationTaskResult,
  type NotificationTaskPayload,
} from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK'

TaskManager.defineTask<NotificationTaskPayload>(
  BACKGROUND_NOTIFICATION_TASK,
  async ({data}) => {
    try {
      // Guard against null data (race condition during Android background initialization)
      if (!data) {
        console.warn(
          '📳 Background notification task received null data, skipping'
        )
        // Keep imports minimal - can't import reportError here
        return BackgroundNotificationTaskResult.NoData
      }

      // Dynamically import the heavy handler to avoid loading full bundle
      const {processBackgroundMessage} = await import('./backgroundHandler')
      await processBackgroundMessage(data)
      return BackgroundNotificationTaskResult.NoData
    } catch (e) {
      console.error('Error in background notification task', e)
      return BackgroundNotificationTaskResult.Failed
    }
  }
)
