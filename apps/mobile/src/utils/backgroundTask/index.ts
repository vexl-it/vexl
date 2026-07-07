import {Effect, Option, Schema} from 'effect/index'
import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'
import {useSetAtom} from 'jotai'
import {useCallback, useEffect} from 'react'
import {checkAreNotificationsEnabledAtom} from '../../state/notifications/areNotificationsEnabledAtom'
import reportError from '../reportError'
import {useOnFocusAndAppState} from '../useFocusAndAppState'
import {BACKGROUND_TASK} from './defineBackgroundTask'

// Every execution of the task boots the whole RN app headlessly (WorkManager
// on Android), which is expensive on battery and can even trigger ANR kill
// loops on low-end devices. The task only serves the new-offers notification
// (sent at most once per 24h) and a fallback chat-inbox sweep for users whose
// push notifications don't arrive, so a few runs per day are plenty. The
// interval is an inexact minimum anyway — the OS schedules runs to minimize
// wakeups (iOS mostly ignores short intervals altogether).
const BACKGROUND_TASK_INTERVAL_MINS = 4 * 60

const RegisteredTaskOptions = Schema.Struct({
  minimumInterval: Schema.optional(Schema.Number),
})

// backgroundTask definition is in ./defineBackgroundTask.ts

export const setupBackgroundTask = async (): Promise<void> => {
  try {
    console.log('Registering background task')
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK)

    if (isRegistered) {
      const registeredInterval = Option.flatMapNullable(
        Schema.decodeUnknownOption(RegisteredTaskOptions)(
          await TaskManager.getTaskOptionsAsync(BACKGROUND_TASK)
        ),
        (options) => options.minimumInterval
      )

      if (Option.contains(registeredInterval, BACKGROUND_TASK_INTERVAL_MINS)) {
        console.log('Background task already registered with current interval')
        return
      }

      // registerTaskAsync is a no-op when the task is already registered, so
      // the task has to be unregistered first for a new interval to take
      // effect (migrates existing installs off a previously used interval).
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK)
    }

    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK, {
      minimumInterval: BACKGROUND_TASK_INTERVAL_MINS,
    })
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

/**
 * Headless launches never mount `useSetupBackgroundTask`, so without this the
 * interval migration above would only run once the user foregrounds the app.
 * Installs updated in the background (Play auto-update) keep both the
 * WorkManager chain and the persisted task options across the update, so they
 * would keep waking the app on a previously registered interval indefinitely.
 * Called from the background task itself to sync the interval there as well.
 *
 * Unlike `setupBackgroundTask` this never registers the task from scratch —
 * the registration lifecycle stays owned by the hook below, so a task that was
 * just unregistered (logout) is not resurrected from the headless run.
 */
export const migrateBackgroundTaskIntervalIfNeeded =
  async (): Promise<void> => {
    try {
      if (!(await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK))) return
    } catch (e) {
      reportError(
        'warn',
        new Error('Error checking background task registration:', {cause: e}),
        {e}
      )
      return
    }
    await setupBackgroundTask()
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
