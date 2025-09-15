import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import {useEffect} from 'react'
import {loadSession} from '../state/session/loadSession'
import {newOffersNotificationBackgroundTask} from './newOffersNotificationBackgroundTask'

const BACKGROUND_TASK = 'VEXL-BACKGROUND-TASK'
const BACKGROUND_TASK_INTERVAL = 1000 * 60 * 60 * 12 // 12 hours

const taskFunction = async (data: unknown): Promise<void> => {
  console.log('Running background task, first loading session', data)
  const isSessionReady = await loadSession()()
  if (!isSessionReady) {
    console.log('Session not ready, skipping background task')
    return
  }

  console.log('Session loaded in background task')
  await newOffersNotificationBackgroundTask()
}

TaskManager.defineTask(BACKGROUND_TASK, taskFunction)

export const setupBackgroundTask = async (): Promise<void> => {
  await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK).catch(() => {
    // Ignore, task is not registered yet.
  })
  await BackgroundTask.registerTaskAsync(BACKGROUND_TASK, {
    minimumInterval: BACKGROUND_TASK_INTERVAL,
  })
}

export function useSetupBackgroundTask(): void {
  useEffect(() => {
    void setupBackgroundTask()
  }, [])
}
