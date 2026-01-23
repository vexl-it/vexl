import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {
  makeCommonHeaders,
  type VexlAppMetaHeader,
} from '@vexl-next/rest-api/src/commonHeaders'
import {UpdateNotificationInfoRequest} from '@vexl-next/rest-api/src/services/notification/contract'
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
import {NoVexlSecretError} from './NoVexlSecretError'

export const updateNotificationMetadataActionAtom = atom(
  null,
  (
    get,
    set,
    {
      expoNotificationToken,
    }: {
      expoNotificationToken?: ExpoNotificationToken
    }
  ) => {
    return Effect.gen(function* () {
      const api = get(apiAtom)
      const {t} = get(translationAtom)
      const language = t('localeName')
      const isDeveloper = get(isDeveloperAtom)
      const vexlNotificationState = get(vexlNotificationTokenAtom)
      const secret = vexlNotificationState.secret

      if (!secret) {
        return yield* Effect.fail(new NoVexlSecretError({}))
      }

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
        deviceModel: deviceModel ? Option.some(deviceModel) : Option.none(),
        osVersion: osVersion ? Option.some(osVersion) : Option.none(),
        prefix,
      }
      const headers = makeCommonHeaders(vexlAppMetaHeader)

      const request = new UpdateNotificationInfoRequest({
        secret,
        expoNotificationToken,
      })

      yield* api.notification.updateNotificationInfo(request, headers)

      set(vexlNotificationTokenAtom, {
        ...vexlNotificationState,
        lastUpdatedMetadata: {
          expoToken: expoNotificationToken ?? undefined,
          version: versionCode,
          locale: language,
        },
      })
    })
  }
)
