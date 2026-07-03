import {Effect} from 'effect'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'
import {refreshNotesActionAtom} from './atoms/refreshNotesActionAtom'

export const refreshNotesTaskId = registerInAppLoadingTask({
  name: 'refreshNotes',
  requirements: {
    requiresUserLoggedIn: true,
    runOn: 'resume',
  },
  task: (store) =>
    store
      .set(refreshNotesActionAtom)
      .pipe(Effect.mapError((cause) => new InAppLoadingTaskError({cause}))),
})
