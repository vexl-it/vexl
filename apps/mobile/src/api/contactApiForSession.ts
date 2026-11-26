import {FetchHttpClient} from '@effect/platform/index'
import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {contact} from '@vexl-next/rest-api/src'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Array, Effect, Option} from 'effect'
import {atom, type Getter} from 'jotai'
import {apiEnv, platform} from '.'
import {type SessionPhoneNumber, type SessionV2} from '../brands/Session.brand'
import {sessionDataOrDummyAtom} from '../state/session'
import {phoneNumbersOfSession} from '../state/session/sessionPhoneNumbers'
import {appSource, version, versionCode} from '../utils/environment'
import {translationAtom} from '../utils/localization/I18nProvider'
import {isDeveloperAtom} from '../utils/preferences'

/**
 * contact-service knows every phone number of the account as a separate user,
 * so each number calls it with its own credentials and country prefix.
 */
export const contactApiForPhoneNumber = (
  get: Getter,
  {phoneNumber, sessionCredentials}: SessionPhoneNumber
): ContactApi =>
  Effect.gen(function* () {
    const prefix = yield* countryPrefixFromNumber(phoneNumber).pipe(
      Effect.option
    )

    return yield* contact.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.contactMs,
      getUserSessionCredentials: () => sessionCredentials,
      appSource,
      language: get(translationAtom).t('localeName'),
      isDeveloper: get(isDeveloperAtom),
      prefix: Option.getOrUndefined(prefix),
    })
  }).pipe(Effect.provide(FetchHttpClient.layer), Effect.runSync)

// For calls made with a session that is not stored yet (login, restore).
export const contactApiForSession = (
  get: Getter,
  session: SessionV2
): ContactApi =>
  contactApiForPhoneNumber(
    get,
    Array.headNonEmpty(phoneNumbersOfSession(session))
  )

export interface PhoneNumberContactApi {
  readonly phoneNumber: E164PhoneNumber
  readonly contactApi: ContactApi
}

/**
 * One contact api per phone number of the account, the main number first.
 */
export const contactApisForSession = (
  get: Getter,
  session: SessionV2
): Array.NonEmptyReadonlyArray<PhoneNumberContactApi> =>
  Array.map(phoneNumbersOfSession(session), (one) => ({
    phoneNumber: one.phoneNumber,
    contactApi: contactApiForPhoneNumber(get, one),
  }))

export const phoneNumberContactApisAtom = atom((get) =>
  contactApisForSession(get, get(sessionDataOrDummyAtom))
)

/**
 * One contact api per phone number of the account, the main number first.
 */
export const contactApisAtom = atom((get) =>
  Array.map(get(phoneNumberContactApisAtom), (one) => one.contactApi)
)
