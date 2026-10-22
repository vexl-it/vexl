import {Effect} from 'effect/index'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import {loadFeatureFlagsActionAtom} from './index'

export const loadFeatureFlagsInAppLoadingTask = registerInAppLoadingTask({
  name: 'loadFeatureFlags',
  requirements: {
    requiresUserLoggedIn: false,
    runOn: 'resume',
  },
  task: (store) =>
    Effect.gen(function* (_) {
      yield* _(store.set(loadFeatureFlagsActionAtom))
    }),
})
