import {Effect} from 'effect'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'
import {getNotificationTokenE} from '../../utils/notifications'
import {reportErrorE} from '../../utils/reportError'
import {createVexlSecretActionAtom} from './actions/createVexlSecretActionAtom'
import {vexlNotificationTokenAtom} from './vexlNotificationTokenAtom'

export const ensureVexlSecretExistsTaskId = registerInAppLoadingTask({
  name: 'ensureVexlSecretExists',
  requirements: {
    requiresUserLoggedIn: true,
    runOn: 'resume',
  },
  task: (store) =>
    Effect.gen(function* () {
      const vexlNotificationState = store.get(vexlNotificationTokenAtom)

      if (vexlNotificationState.secret) {
        console.log(
          'Vexl notification secret already exists, skipping creation'
        )
        return
      }

      const expoToken = yield* getNotificationTokenE()

      console.log('Creating vexl notification secret...')
      yield* Effect.either(
        store
          .set(createVexlSecretActionAtom, {expoNotificationToken: expoToken})
          .pipe(
            Effect.tapError((e) =>
              reportErrorE(
                'error',
                new Error('Error creating vexl notification secret'),
                {e}
              )
            ),
            Effect.mapError(
              (e) =>
                new InAppLoadingTaskError({
                  message: 'Failed to create vexl notification secret',
                  cause: e,
                })
            )
          )
      )
      console.log('Vexl notification secret created successfully')
    }),
})
