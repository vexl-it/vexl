import {Effect, Either} from 'effect/index'
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
      Effect.gen(function* (_) {
        const vexlNotificationState = store.get(vexlNotificationTokenAtom)

        if (!vexlNotificationState.secret) {
          console.log(
            'Vexl notification secret does not exist, cannot create session notification token'
          )
          return
        }

        const sessionNotificationToken = yield* _(
          Effect.either(
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
        )

        if (Either.isRight(sessionNotificationToken)) {
          store.set(
            sessionNotificationTokenAtom,
            sessionNotificationToken.right
          )
        }

        console.log('Session notification token created successfully')
      }),
  })
