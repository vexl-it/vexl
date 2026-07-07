import {Effect} from 'effect'
import * as BackgroundTask from 'expo-background-task'
import {getDefaultStore} from 'jotai'
import fetchMessagesForAllInboxesAtom from '../../state/chat/atoms/fetchNewMessagesActionAtom'
import {loadSession} from '../../state/session/loadSession'
import {newOffersNotificationBackgroundTask} from '../newOffersNotificationBackgroundTask'
import {migrateBackgroundTaskIntervalIfNeeded} from './index'

export async function processBackgroundTask(): Promise<BackgroundTask.BackgroundTaskResult> {
  const result = await runBackgroundTaskWork()
  // Headless launches never run useSetupBackgroundTask, so sync the registered
  // interval here as well — otherwise installs that are only ever woken by the
  // scheduler keep the previously registered interval forever. No-op unless
  // the interval changed. Runs after the work on purpose: on Android the
  // unregister/re-register cancels the WorkManager job currently executing us,
  // which must not interrupt the actual work.
  await migrateBackgroundTaskIntervalIfNeeded()
  return result
}

async function runBackgroundTaskWork(): Promise<BackgroundTask.BackgroundTaskResult> {
  try {
    console.log('Running background task, first loading session')
    const loadSessionResult = await Effect.runPromise(loadSession())
    if (!loadSessionResult.sessionLoaded) {
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
