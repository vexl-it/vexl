import {FetchHttpClient} from '@effect/platform/index'
import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {contact, offer, user} from '@vexl-next/rest-api/src'
import {type ServiceUrl} from '@vexl-next/rest-api/src/ServiceUrl.brand'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type UserApi} from '@vexl-next/rest-api/src/services/user'
import {Array, Effect, Option} from 'effect'
import {atom, type Getter} from 'jotai'
import {apiEnv, platform} from '.'
import {type SessionPhoneNumber, type SessionV2} from '../brands/Session.brand'
import {sessionDataOrDummyAtom} from '../state/session'
import {
  mainPhoneNumberOfSession,
  ownPublicKeysOfSession,
  phoneNumbersOfSession,
} from '../state/session/sessionPhoneNumbers'
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
 * Every phone number of the account is a separate user on the servers, with
 * its own keys, credentials and country prefix.
 */
const apiParamsForPhoneNumber = (
  get: Getter,
  {phoneNumber, sessionCredentials}: SessionPhoneNumber,
  url: ServiceUrl
): Parameters<typeof offer.api>[0] => ({
  platform,
  clientVersion: versionCode,
  clientSemver: version,
  getUserSessionCredentials: () => sessionCredentials,
  appSource,
  language: get(translationAtom).t('localeName'),
  isDeveloper: get(isDeveloperAtom),
  deviceModel,
  osVersion,
  url,
  prefix: countryPrefixFromNumber(phoneNumber).pipe(
    Effect.option,
    Effect.runSync,
    Option.getOrUndefined
  ),
})

export const contactApiForPhoneNumber = (
  get: Getter,
  phoneNumber: SessionPhoneNumber
): ContactApi =>
  contact
    .api(apiParamsForPhoneNumber(get, phoneNumber, apiEnv.contactMs))
    .pipe(Effect.provide(FetchHttpClient.layer), Effect.runSync)

export const offerApiForPhoneNumber = (
  get: Getter,
  phoneNumber: SessionPhoneNumber
): OfferApi =>
  offer
    .api(apiParamsForPhoneNumber(get, phoneNumber, apiEnv.offerMs))
    .pipe(Effect.provide(FetchHttpClient.layer), Effect.runSync)

export const userApiForPhoneNumber = (
  get: Getter,
  phoneNumber: SessionPhoneNumber
): UserApi =>
  user
    .api(apiParamsForPhoneNumber(get, phoneNumber, apiEnv.userMs))
    .pipe(Effect.provide(FetchHttpClient.layer), Effect.runSync)

// For calls made with a session that is not stored yet (login, restore).
export const contactApiForSession = (
  get: Getter,
  session: SessionV2
): ContactApi =>
  contactApiForPhoneNumber(get, mainPhoneNumberOfSession(session))

export interface PhoneNumberApis {
  readonly phoneNumber: SessionPhoneNumber
  readonly contactApi: ContactApi
  readonly offerApi: OfferApi
  readonly userApi: UserApi
}

/**
 * Api clients for every phone number of the account, the main number first.
 * Only contact-service, offers and notes "for me", and deleting the user are
 * per number. Everything else uses the main number (`apiAtom`).
 */
export const phoneNumberApisAtom = atom(
  (get): Array.NonEmptyReadonlyArray<PhoneNumberApis> =>
    Array.map(
      phoneNumbersOfSession(get(sessionDataOrDummyAtom)),
      (phoneNumber) => ({
        phoneNumber,
        contactApi: contactApiForPhoneNumber(get, phoneNumber),
        offerApi: offerApiForPhoneNumber(get, phoneNumber),
        userApi: userApiForPhoneNumber(get, phoneNumber),
      })
    )
)

/**
 * One contact api per phone number of the account, the main number first.
 */
export const contactApisAtom = atom((get) =>
  Array.map(get(phoneNumberApisAtom), (one) => one.contactApi)
)

/**
 * Keys of all phone numbers of the account, never anyone's connections.
 */
export const ownPublicKeysAtom = atom((get) =>
  ownPublicKeysOfSession(get(sessionDataOrDummyAtom))
)
