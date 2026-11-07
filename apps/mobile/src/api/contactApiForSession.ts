import {FetchHttpClient} from '@effect/platform/index'
import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {contact} from '@vexl-next/rest-api/src'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Effect, Option} from 'effect'
import {type Getter} from 'jotai'
import {apiEnv, platform} from '.'
import {type SessionV2} from '../brands/Session.brand'
import {appSource, version, versionCode} from '../utils/environment'
import {translationAtom} from '../utils/localization/I18nProvider'
import {isDeveloperAtom} from '../utils/preferences'

// For calls made with a session that is not stored yet (login, restore).
export const contactApiForSession = (
  get: Getter,
  session: SessionV2
): ContactApi =>
  Effect.gen(function* () {
    const prefix = yield* countryPrefixFromNumber(session.phoneNumber).pipe(
      Effect.option
    )

    return yield* contact.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.contactMs,
      getUserSessionCredentials: () => session.sessionCredentials,
      appSource,
      language: get(translationAtom).t('localeName'),
      isDeveloper: get(isDeveloperAtom),
      prefix: Option.getOrUndefined(prefix),
    })
  }).pipe(Effect.provide(FetchHttpClient.layer), Effect.runSync)
