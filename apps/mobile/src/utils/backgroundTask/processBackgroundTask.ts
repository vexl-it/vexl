import {Effect} from 'effect'
import * as BackgroundTask from 'expo-background-task'
import {getDefaultStore} from 'jotai'
import fetchMessagesForAllInboxesAtom from '../../state/chat/atoms/fetchNewMessagesActionAtom'
import {loadSession} from '../../state/session/loadSession'
import {newOffersNotificationBackgroundTask} from '../newOffersNotificationBackgroundTask'

export async function processBackgroundTask(): Promise<BackgroundTask.BackgroundTaskResult> {
  try {
    console.log('Running background task, first loading session')
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
