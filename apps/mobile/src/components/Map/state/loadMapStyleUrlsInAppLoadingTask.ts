import {Effect} from 'effect/index'
import {registerInAppLoadingTask} from '../../../utils/inAppLoadingTasks'
import {loadMapStyleUrlsActionAtom} from './mapStyleUrlsAtoms'

export const loadMapStyleUrlsInAppLoadingTask = registerInAppLoadingTask({
  name: 'loadMapStyleUrls',
  requirements: {
    requiresUserLoggedIn: false,
    runOn: 'resume',
  },
  task: (store) =>
    Effect.gen(function* (_) {
      yield* _(store.set(loadMapStyleUrlsActionAtom))
    }),
})
