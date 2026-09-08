import {Effect} from 'effect'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import {cleanupRemovedClubsActionAtom} from './atom/removedClubsAtom'

export const cleanupRemovedClubsInAppLoadingTaskId = registerInAppLoadingTask({
  name: 'cleanupRemovedClubs',
  requirements: {
    requiresUserLoggedIn: true,
    runOn: 'start',
  },
  task: (store) =>
    Effect.gen(function* () {
      store.set(cleanupRemovedClubsActionAtom)
    }),
})
