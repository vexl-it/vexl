import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'

export const BACKGROUND_TASK = 'VEXL-BACKGROUND-TASK'

TaskManager.defineTask(
  BACKGROUND_TASK,
  async (): Promise<BackgroundTask.BackgroundTaskResult> => {
    try {
      // Dynamically import heavy handler to avoid loading full bundle at startup
      const {processBackgroundTask} = await import('./processBackgroundTask')
      const result = await processBackgroundTask()
      return result
    } catch (error) {
      console.error('Error in background task', error)
      return BackgroundTask.BackgroundTaskResult.Failed
    }
  }
)
