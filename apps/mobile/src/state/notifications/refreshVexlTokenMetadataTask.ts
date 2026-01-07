import {Effect} from 'effect'
import {versionCode} from '../../utils/environment'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {getNotificationTokenE} from '../../utils/notifications'
import {reportErrorE} from '../../utils/reportError'
import {updateNotificationMetadataActionAtom} from './actions/updateNotificationMetadataActionAtom'
import {ensureVexlSecretExistsTaskId} from './ensureVexlSecretExistsTask'
import {vexlNotificationTokenAtom} from './vexlNotificationTokenAtom'

export const refreshVexlTokenMetadataTaskId = registerInAppLoadingTask({
  name: 'refreshVexlTokenMetadata',
  requirements: {
    requiresUserLoggedIn: true,
    runOn: 'resume',
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
      const {t} = store.get(translationAtom)
      const currentLocale = t('localeName')
      const currentVersion = versionCode

      const lastMetadata = vexlNotificationState.lastUpdatedMetadata

      // Check if anything changed
      const expoTokenChanged =
        expoToken && lastMetadata?.expoToken !== expoToken
      const versionChanged = lastMetadata?.version !== currentVersion
      const localeChanged = lastMetadata?.locale !== currentLocale

      if (!expoTokenChanged && !versionChanged && !localeChanged) {
        console.log(
          'Vexl notification metadata is up to date, skipping refresh'
        )
        return
      }

      console.log('Refreshing vexl notification metadata...', {
        expoTokenChanged,
        versionChanged,
        localeChanged,
      })

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
