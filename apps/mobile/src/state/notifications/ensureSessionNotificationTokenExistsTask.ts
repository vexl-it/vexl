import {Effect, Result} from 'effect'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'
import {reportErrorE} from '../../utils/reportError'
import {sessionNotificationTokenAtom} from '../session'
import {generateVexlTokenActionAtom} from './actions/generateVexlTokenActionAtom'
import {ensureVexlSecretExistsTaskId} from './ensureVexlSecretExistsTask'
import {vexlNotificationTokenAtom} from './vexlNotificationTokenAtom'

export const ensureSessionNotificationTokenExistsTask =
  registerInAppLoadingTask({
    name: 'ensureSessionNotificationTokenExists',
    dependsOn: [{id: ensureVexlSecretExistsTaskId}],
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    task: (store) =>
      Effect.gen(function* () {
        const vexlNotificationState = store.get(vexlNotificationTokenAtom)

        if (!vexlNotificationState.secret) {
          console.log(
            'Vexl notification secret does not exist, cannot create session notification token'
          )
          return
        }

        const sessionNotificationToken = yield* Effect.result(
          store.set(generateVexlTokenActionAtom).pipe(
            Effect.tapError((e) =>
              reportErrorE(
                'error',
                new Error('Error creating session notification token'),
                {e}
              )
            ),
            Effect.mapError(
              (e) =>
                new InAppLoadingTaskError({
                  message: 'Failed to create session notification token',
                  cause: e,
                })
            )
          )
        )

        if (Result.isSuccess(sessionNotificationToken)) {
          store.set(
            sessionNotificationTokenAtom,
            sessionNotificationToken.success
          )
        }

        console.log('Session notification token created successfully')
      }),
  })
