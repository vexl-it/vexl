import {Effect} from 'effect/index'
import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import {getDefaultStore, useSetAtom} from 'jotai'
import {useCallback, useEffect} from 'react'
import fetchMessagesForAllInboxesAtom from '../state/chat/atoms/fetchNewMessagesActionAtom'
import {checkAreNotificationsEnabledAtom} from '../state/notifications/areNotificationsEnabledAtom'
import {loadSession} from '../state/session/loadSession'
import {newOffersNotificationBackgroundTask} from './newOffersNotificationBackgroundTask'
import {useOnFocusAndAppState} from './useFocusAndAppState'

const BACKGROUND_TASK = 'VEXL-BACKGROUND-TASK'
const BACKGROUND_TASK_INTERVAL_MINS = 15

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
      console.log('Error running background task', error)
      return BackgroundTask.BackgroundTaskResult.Failed
    }
  }
)

export const setupBackgroundTask = async (): Promise<void> => {
  console.log('Registering background task')
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK)
  if (!isRegistered) {
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK, {
      minimumInterval: BACKGROUND_TASK_INTERVAL_MINS,
    })
  }
  console.log('Background task is registered', {
    isR: await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK),
  })
}

export function useSetupBackgroundTask(): void {
  const checkAreNotificationEnabled = useSetAtom(
    checkAreNotificationsEnabledAtom
  )

  useOnFocusAndAppState(
    useCallback(() => {
      Effect.runFork(checkAreNotificationEnabled())
    }, [checkAreNotificationEnabled])
  )

  useEffect(() => {
    void setupBackgroundTask()

    return () => {
      void BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK)
    }
  }, [checkAreNotificationEnabled])
}
