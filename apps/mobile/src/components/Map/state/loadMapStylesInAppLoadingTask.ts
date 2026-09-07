import {Effect} from 'effect'
import {registerInAppLoadingTask} from '../../../utils/inAppLoadingTasks'
import {loadMapStylesActionAtom} from './mapStylesAtoms'

export const loadMapStylesInAppLoadingTask = registerInAppLoadingTask({
  name: 'loadMapStyles',
  requirements: {
    requiresUserLoggedIn: false,
    runOn: 'resume',
  },
  task: (store) =>
    Effect.gen(function* () {
      yield* store.set(loadMapStylesActionAtom)
    }),
})
