import {Effect} from 'effect'
import {ensureKeyDerivationCountersActionAtom} from '.'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'

export const ensureKeyDerivationCountersInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'ensureKeyDerivationCounters',
    requirements: {requiresUserLoggedIn: true, runOn: 'start'},
    task: (store) =>
      store
        .set(ensureKeyDerivationCountersActionAtom)
        .pipe(Effect.mapError((cause) => new InAppLoadingTaskError({cause}))),
  })
