import {Effect} from 'effect/index'
import {registerInAppLoadingTask} from '../../../utils/inAppLoadingTasks'
import {loadMapStylesActionAtom} from './mapStylesAtoms'

export const loadMapStylesInAppLoadingTask = registerInAppLoadingTask({
  name: 'loadMapStyles',
  requirements: {
    requiresUserLoggedIn: false,
    runOn: 'resume',
  },
  task: (store) =>
    Effect.gen(function* (_) {
      yield* _(store.set(loadMapStylesActionAtom))
    }),
})
