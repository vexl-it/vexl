import {Effect} from 'effect/index'
import {
  FIVE_MINUTES_MS,
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'
import loadAndNormalizeContactsFromDeviceActionAtom from './atom/loadAndNormalizeContactsFromDeviceActionAtom'
import {areContactsPermissionsAlreadyGranted} from './utils'

export const loadContactsFromDeviceActionAtomInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'loadContactsFromDevice',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
      minTimeBetweenRunsMs: FIVE_MINUTES_MS,
    },
    task: (store) =>
      Effect.gen(function* (_) {
        const contactsPermissionsAlreadyGranted = yield* _(
          areContactsPermissionsAlreadyGranted(),
          Effect.catchAll(() => Effect.succeed(false))
        )

        if (!contactsPermissionsAlreadyGranted) return

        yield* _(
          store.set(loadAndNormalizeContactsFromDeviceActionAtom).pipe(
            Effect.catchAll((error) => {
              if (error._tag === 'UnknownContactsError') {
                return Effect.succeed(true)
              }

              return Effect.fail(
                new InAppLoadingTaskError({
                  message: 'Error while loading contacts from device',
                  cause: error,
                })
              )
            })
          )
        )
      }),
  })
