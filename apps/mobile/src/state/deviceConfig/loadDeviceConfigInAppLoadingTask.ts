import {Effect} from 'effect/index'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import {loadDeviceConfigActionAtom} from './index'

export const loadDeviceConfigInAppLoadingTask = registerInAppLoadingTask({
  name: 'loadDeviceConfig',
  requirements: {
    requiresUserLoggedIn: false,
    runOn: 'resume',
  },
  task: (store) =>
    Effect.gen(function* (_) {
      yield* _(store.set(loadDeviceConfigActionAtom))
    }),
})
