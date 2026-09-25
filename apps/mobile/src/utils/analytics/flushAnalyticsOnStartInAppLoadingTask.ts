import {Duration, Effect, Record} from 'effect'
import {getDefaultStore} from 'jotai'
import {registerInAppLoadingTask} from '../inAppLoadingTasks'
import {analyticsInstancesAtom, setAnalyticsInstancesAtom} from './atoms'
import {flushAnalyticsActionAtom} from './flush'
import {releaseDelayedUploads} from './instances'

const MAX_START_DELAY_MS = 60_000

// Module load is the only point that runs before any signal site in this
// process, so a journey started in this session stays queued until the next
// start (docs/analytics/system.md, section 6.4).
const defaultStore = getDefaultStore()
if (
  Record.some(
    defaultStore.get(analyticsInstancesAtom),
    (one) => one.pending === 'nextStart'
  )
)
  defaultStore.set(setAnalyticsInstancesAtom, releaseDelayedUploads)

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
