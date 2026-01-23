import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {
  makeCommonHeaders,
  type VexlAppMetaHeader,
} from '@vexl-next/rest-api/src/commonHeaders'
import {CreateNotificationSecretRequest} from '@vexl-next/rest-api/src/services/notification/contract'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import {apiAtom, platform} from '../../../api'
import {
  appSource,
  deviceModel,
  osVersion,
  version,
  versionCode,
} from '../../../utils/environment'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {isDeveloperAtom} from '../../../utils/preferences'
import {sessionDataOrDummyAtom} from '../../session'
import {vexlNotificationTokenAtom} from '../vexlNotificationTokenAtom'

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
      const isDeveloper = get(isDeveloperAtom)
      const prefix = yield* countryPrefixFromNumber(
        get(sessionDataOrDummyAtom).phoneNumber
      ).pipe(Effect.option)

      const vexlAppMetaHeader: VexlAppMetaHeader = {
        platform,
        versionCode,
        semver: version,
        appSource,
        language,
        isDeveloper,
        deviceModel: Option.fromNullable(deviceModel),
        osVersion: Option.fromNullable(osVersion),
        prefix,
      }
      const headers = makeCommonHeaders(vexlAppMetaHeader)
      const request = new CreateNotificationSecretRequest({
        expoNotificationToken: expoNotificationToken ?? undefined,
      })

      const response = yield* api.notification.createNotificationSecret(
        request,
        headers
      )

      set(vexlNotificationTokenAtom, {
        secret: response.secret,
        lastUpdatedMetadata: {
          expoToken: expoNotificationToken ?? undefined,
          version: versionCode,
          locale: language,
        },
      })

      return response.secret
    })
)
