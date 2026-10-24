import {Duration, Effect} from 'effect'
import {registerInAppLoadingTask} from '../inAppLoadingTasks'
import {flushAnalyticsActionAtom} from './flush'
import {refreshAnalyticsRelaysActionAtom} from './relayConfig'

const MAX_START_DELAY_MS = 60_000

// The random delay keeps the upload from lining up with the refresh calls the
// app makes at the same moment, including the relay list fetch.
export const flushAnalyticsOnStartTaskId = registerInAppLoadingTask({
  name: 'flushAnalyticsOutbox',
  requirements: {requiresUserLoggedIn: false, runOn: 'start'},
  runAfterOtherTasks: true,
  task: (store) =>
    store.set(refreshAnalyticsRelaysActionAtom).pipe(
      Effect.andThen(
        Effect.sleep(Duration.millis(Math.random() * MAX_START_DELAY_MS))
      ),
      Effect.andThen(() => store.set(flushAnalyticsActionAtom))
    ),
})
