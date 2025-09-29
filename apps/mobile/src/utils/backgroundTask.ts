import {Effect} from 'effect/index'
import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import {getDefaultStore} from 'jotai'
import {useEffect} from 'react'
import fetchMessagesForAllInboxesAtom from '../state/chat/atoms/fetchNewMessagesActionAtom'
import {loadSession} from '../state/session/loadSession'
import {newOffersNotificationBackgroundTask} from './newOffersNotificationBackgroundTask'

const BACKGROUND_TASK = 'VEXL-BACKGROUND-TASK'
const BACKGROUND_TASK_INTERVAL = 15

TaskManager.defineTask(
  BACKGROUND_TASK,
  async (data: unknown): Promise<BackgroundTask.BackgroundTaskResult> => {
    try {
      console.log('Running background task, first loading session', data)
      const isSessionReady = await Effect.runPromise(loadSession())
      if (!isSessionReady) {
        console.log('Session not ready, skipping background task')
        return BackgroundTask.BackgroundTaskResult.Success
      }

      console.log('Session loaded in background task')

      await newOffersNotificationBackgroundTask()
      await Effect.runPromise(
        getDefaultStore().set(fetchMessagesForAllInboxesAtom)
      )
      return BackgroundTask.BackgroundTaskResult.Success
    } catch (error) {
      console.log('Erro running background task', error)
      return BackgroundTask.BackgroundTaskResult.Failed
    }
  }
)

export const setupBackgroundTask = async (): Promise<void> => {
  console.log('Registering background task')
  await BackgroundTask.registerTaskAsync(BACKGROUND_TASK, {
    minimumInterval: BACKGROUND_TASK_INTERVAL,
  })
  console.log('Background task is registered', {
    isR: await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK),
  })
}

export function useSetupBackgroundTask(): void {
  useEffect(() => {
    void setupBackgroundTask()
  }, [])
}
