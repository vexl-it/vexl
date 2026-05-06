import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {
  InvalidateNotificationTokenRequest,
  UpdateNotificationInfoRequest,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {versionCode} from '../../../utils/environment'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {notificationPreferencesAtom} from '../../../utils/preferences'
import {reportErrorE} from '../../../utils/reportError'
import {vexlNotificationTokenAtom} from '../vexlNotificationTokenAtom'
import {generateVexlTokenActionAtom} from './generateVexlTokenActionAtom'
import {NoVexlSecretError} from './NoVexlSecretError'

export const syncVexlNotificationTokensActionAtom = atom(
  null,
  (
    get,
    set,
    params?: {
      // If not set to a value, don't update it, use the existing one.
      // If set to null, explicitly set it to null (which will remove the expo token from the backend and stop all notifications).
      expoNotificationToken?: ExpoNotificationToken | null
    }
  ) =>
    Effect.gen(function* () {
      const api = get(apiAtom)
      const {t} = get(translationAtom)
      const language = t('localeName')

      const notificationPreferences = get(notificationPreferencesAtom)
      const vexlNotificationState = get(vexlNotificationTokenAtom)

      const secret = vexlNotificationState.secret
      const expoNotificationToken = (() => {
        // We should remove it
        if (params?.expoNotificationToken === null) return undefined

        // otherwise fallback to the existing one sent before (if any)
        return (
          params?.expoNotificationToken ??
          vexlNotificationState.lastUpdatedMetadata?.expoToken ??
          undefined
        )
      })()

      if (!secret) {
        return yield* Effect.fail(new NoVexlSecretError({}))
      }

      const marketingVexlTokenToInvalidate: VexlNotificationToken | null =
        notificationPreferences.marketing
          ? null
          : vexlNotificationState.marketingVexlToken

      const systemVexlToken =
        vexlNotificationState.systemVexlToken ??
        (yield* set(generateVexlTokenActionAtom))

      const marketingVexlToken = notificationPreferences.marketing
        ? (vexlNotificationState.marketingVexlToken ??
          (yield* set(generateVexlTokenActionAtom)))
        : undefined

      const request = new UpdateNotificationInfoRequest({
        secret,
        expoNotificationToken,
        systemVexlToken,
        marketingVexlToken,
      })

      yield* api.notification.updateNotificationInfo(request)

      if (marketingVexlTokenToInvalidate) {
        yield* api.notification
          .invalidateNotificationToken(
            new InvalidateNotificationTokenRequest({
              secret,
              tokenToInvalidate: marketingVexlTokenToInvalidate,
            })
          )
          .pipe(
            Effect.catchAll((e) =>
              reportErrorE(
                'warn',
                new Error('Error invalidating old marketing vexl token'),
                {e}
              )
            )
          )
      }

      set(vexlNotificationTokenAtom, {
        ...vexlNotificationState,
        systemVexlToken,
        marketingVexlToken: marketingVexlToken ?? null,
        lastUpdatedMetadata: {
          expoToken: expoNotificationToken ?? undefined,
          version: versionCode,
          locale: language,
        },
      })
    })
)
