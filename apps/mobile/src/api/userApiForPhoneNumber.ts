import {FetchHttpClient} from '@effect/platform/index'
import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {user} from '@vexl-next/rest-api/src'
import {type UserApi} from '@vexl-next/rest-api/src/services/user'
import {Effect, Option} from 'effect'
import {type Getter} from 'jotai'
import {apiEnv, platform} from '.'
import {type SessionPhoneNumber} from '../brands/Session.brand'
import {
  appSource,
  deviceModel,
  osVersion,
  version,
  versionCode,
} from '../utils/environment'
import {translationAtom} from '../utils/localization/I18nProvider'
import {isDeveloperAtom} from '../utils/preferences'

/**
 * user-service authenticated as one phone number of the account, for calls
 * that depend on the number (the backup key is derived from its hash).
 */
export const userApiForPhoneNumber = (
  get: Getter,
  {phoneNumber, sessionCredentials}: SessionPhoneNumber
): UserApi =>
  Effect.gen(function* () {
    const prefix = yield* countryPrefixFromNumber(phoneNumber).pipe(
      Effect.option
    )

    return yield* user.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.userMs,
      getUserSessionCredentials: () => sessionCredentials,
      appSource,
      language: get(translationAtom).t('localeName'),
      isDeveloper: get(isDeveloperAtom),
      deviceModel,
      osVersion,
      prefix: Option.getOrUndefined(prefix),
    })
  }).pipe(Effect.provide(FetchHttpClient.layer), Effect.runSync)
