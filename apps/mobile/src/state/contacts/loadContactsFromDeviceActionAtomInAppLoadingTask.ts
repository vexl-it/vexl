import {Effect} from 'effect/index'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import loadContactsFromDeviceActionAtom, {
  loadingContactsFromDeviceAtom,
} from './atom/loadContactsFromDeviceActionAtom'
import {areContactsPermissionsAlreadyGranted} from './utils'

export const loadContactsFromDeviceActionAtomInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'loadContactsFromDevice',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    task: (store) =>
      Effect.gen(function* (_) {
        const contactsPermissionsAlreadyGranted = yield* _(
          areContactsPermissionsAlreadyGranted(),
          Effect.catchAll(() => Effect.succeed(false))
        )

        if (!contactsPermissionsAlreadyGranted) return

        store.set(loadingContactsFromDeviceAtom, true)

        yield* _(
          store.set(loadContactsFromDeviceActionAtom).pipe(
            Effect.catchAll(() => Effect.succeed('success')),
            Effect.ensuring(
              Effect.sync(() => {
                store.set(loadingContactsFromDeviceAtom, false)
              })
            )
          )
        )
      }),
  })
