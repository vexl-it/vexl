import {Duration, Effect} from 'effect'
import {registerInAppLoadingTask} from '../inAppLoadingTasks'
import {flushAnalyticsActionAtom} from './flush'

const MAX_START_DELAY_MS = 60_000

// The random delay keeps the upload from lining up with the refresh calls the
// app makes at the same moment.
export const flushAnalyticsOnStartTaskId = registerInAppLoadingTask({
  name: 'flushAnalyticsOutbox',
  requirements: {requiresUserLoggedIn: false, runOn: 'start'},
  runAfterOtherTasks: true,
  task: (store) =>
    Effect.sleep(Duration.millis(Math.random() * MAX_START_DELAY_MS)).pipe(
      Effect.andThen(() => store.set(flushAnalyticsActionAtom))
    ),
})
