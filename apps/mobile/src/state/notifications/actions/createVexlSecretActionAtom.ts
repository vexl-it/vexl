import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {CreateNotificationSecretRequest} from '@vexl-next/rest-api/src/services/notification/contract'
import {Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {versionCode} from '../../../utils/environment'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {vexlNotificationTokenAtom} from '../vexlNotificationTokenAtom'
import {syncVexlNotificationTokensActionAtom} from './syncVexlNotificationTokensActionAtom'

export const createVexlSecretActionAtom = atom(
  null,
  (
    get,
    set,
    {
      expoNotificationToken,
    }: {expoNotificationToken: ExpoNotificationToken | null}
  ) =>
    Effect.gen(function* () {
      const api = get(apiAtom)
      const {t} = get(translationAtom)
      const language = t('localeName')

      const request = new CreateNotificationSecretRequest({
        expoNotificationToken: expoNotificationToken ?? undefined,
      })

      const response = yield* api.notification.createNotificationSecret(request)

      set(vexlNotificationTokenAtom, {
        secret: response.secret,
        systemVexlToken: null,
        marketingVexlToken: null,
        lastUpdatedMetadata: {
          expoToken: expoNotificationToken ?? undefined,
          version: versionCode,
          locale: language,
        },
      })

      yield* set(syncVexlNotificationTokensActionAtom, {
        expoNotificationToken,
      })

      return response.secret
    })
)
