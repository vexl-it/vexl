import {Effect} from 'effect'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'
import {getNotificationTokenE} from '../../utils/notifications'
import {reportErrorE} from '../../utils/reportError'
import {updateNotificationMetadataActionAtom} from './actions/updateNotificationMetadataActionAtom'
import {ensureVexlSecretExistsTaskId} from './ensureVexlSecretExistsTask'
import {vexlNotificationTokenAtom} from './vexlNotificationTokenAtom'

export const refreshVexlTokenMetadataTaskId = registerInAppLoadingTask({
  name: 'refreshVexlTokenMetadata',
  requirements: {
    runOn: 'resume',
    requiresUserLoggedIn: true,
  },
  dependsOn: [{id: ensureVexlSecretExistsTaskId}],
  task: (store) =>
    Effect.gen(function* () {
      const vexlNotificationState = store.get(vexlNotificationTokenAtom)

      // If no secret exists, nothing to update
      if (!vexlNotificationState.secret) {
        console.log('No vexl notification secret, skipping metadata refresh')
        return
      }

      const expoToken = yield* getNotificationTokenE()

      yield* Effect.either(
        store
          .set(updateNotificationMetadataActionAtom, {
            expoNotificationToken: expoToken ?? undefined,
          })
          .pipe(
            Effect.tapError((e) =>
              reportErrorE(
                'warn',
                new Error('Error refreshing vexl notification metadata'),
                {e}
              )
            ),
            Effect.mapError(
              (e) =>
                new InAppLoadingTaskError({
                  cause: e,
                })
            )
          )
      )
      console.log('Vexl notification metadata refreshed successfully')
    }),
})
