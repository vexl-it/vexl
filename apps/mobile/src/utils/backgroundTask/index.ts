import {Effect} from 'effect/index'
import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import {useSetAtom} from 'jotai'
import {useCallback, useEffect} from 'react'
import {checkAreNotificationsEnabledAtom} from '../../state/notifications/areNotificationsEnabledAtom'
import reportError from '../reportError'
import {useOnFocusAndAppState} from '../useFocusAndAppState'
import {BACKGROUND_TASK} from './defineBackgroundTask'

const BACKGROUND_TASK_INTERVAL_MINS = 15

// backgroundTask definition is in ./defineBackgroundTask.ts

export const setupBackgroundTask = async (): Promise<void> => {
  try {
    console.log('Registering background task')
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK)

    if (!isRegistered) {
      await BackgroundTask.registerTaskAsync(BACKGROUND_TASK, {
        minimumInterval: BACKGROUND_TASK_INTERVAL_MINS,
      })
    }
    console.log('Background task is registered', {
      isR: await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK),
    })
  } catch (e) {
    reportError(
      'warn',
      new Error('Error registering background task:', {cause: e}),
      {e}
    )
    console.error('Error registering background task')
  }
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
