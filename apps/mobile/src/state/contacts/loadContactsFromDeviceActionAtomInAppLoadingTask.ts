import {Effect} from 'effect/index'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import loadContactsFromDeviceActionAtom, {
  loadingContactsFromDeviceAtom,
} from './atom/loadContactsFromDeviceActionAtom'

export const loadContactsFromDeviceActionAtomInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'loadContactsFromDevice',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    task: (store) =>
      Effect.gen(function* (_) {
        store.set(loadingContactsFromDeviceAtom, true)

        yield* _(
          store.set(loadContactsFromDeviceActionAtom),
          Effect.catchAll(() => Effect.succeed('success' as const))
        )

        store.set(loadingContactsFromDeviceAtom, false)
      }),
  })
