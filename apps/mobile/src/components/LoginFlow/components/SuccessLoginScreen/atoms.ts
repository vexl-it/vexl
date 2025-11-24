import {FetchHttpClient} from '@effect/platform/index'
import {type KeyHolder} from '@vexl-next/cryptography/src'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  EcdsaSignature,
  ecdsaSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {contact, user} from '@vexl-next/rest-api/src'
import {type VerifyPhoneNumberResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, Match, Option, Schema} from 'effect'
import {atom} from 'jotai'
import {apiAtom, apiEnv, platform} from '../../../../api'
import {SessionE, type Session} from '../../../../brands/Session.brand'
import {defaultCurrencyBaseOnCountryCodeActionAtom} from '../../../../state/defaultCurrencyBaseOnCountryCodeActionAtom'
import {sessionAtom} from '../../../../state/session'
import {
  appSource,
  deviceModel,
  osVersion,
  version,
  versionCode,
} from '../../../../utils/environment'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {navigationRef} from '../../../../utils/navigation'
import {isDeveloperAtom} from '../../../../utils/preferences'
import reportError from '../../../../utils/reportError'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
import {showErrorAlert} from '../../../ErrorAlert'
import {contactsMigratedAtom} from '../../../VersionMigrations/atoms'

const TARGET_TIME_MILLISECONDS = 3000

function resetNavigationToIntroScreen(): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate('LoginFlow', {screen: 'PhoneNumber'})
  }
}

const handleUserCreationActionAtom = atom(
  null,
  (
    get,
    set,
    {
      session,
    }: {
      session: Session
    }
  ) => {
    const startedAt = Date.now()

    return contact
      .api({
        platform,
        clientVersion: versionCode,
        clientSemver: version,
        url: apiEnv.contactMs,
        getUserSessionCredentials: () => session.sessionCredentials,
        appSource,
        language: get(translationAtom).t('localeName'),
        isDeveloper: get(isDeveloperAtom),
      })
      .pipe(
        Effect.flatMap((contactApi) =>
          contactApi.createUser({firebaseToken: null, expoToken: null})
        ),
        Effect.tapError((e) => {
          reportError('error', new Error('Error creating user at contact MS'), {
            e,
          })

          resetNavigationToIntroScreen()

          return Effect.fail(e)
        }),
        Effect.tap(() => {
          const leftToWait = TARGET_TIME_MILLISECONDS - (Date.now() - startedAt)
          if (leftToWait > 0)
            setTimeout(() => {
              set(sessionAtom, Option.some(session))
            }, leftToWait)
          else set(sessionAtom, Option.some(session))
        })
      )
  }
)

const deleteUserAndResetFlowActionAtom = atom(
  null,
  (get, set, {session}: {session: Session}) => {
    return user
      .api({
        platform,
        clientSemver: version,
        clientVersion: versionCode,
        url: apiEnv.userMs,
        getUserSessionCredentials: () => session.sessionCredentials,
        isDeveloper: get(isDeveloperAtom),
        language: get(translationAtom).t('localeName'),
        appSource,
        deviceModel,
        osVersion,
      })
      .pipe(
        Effect.flatMap((userApi) => userApi.deleteUser()),
        Effect.tapError((e) => {
          reportError('error', new Error('Error deleting user in onboarding'), {
            e,
          })
          return Effect.fail(e)
        }),
        Effect.andThen(resetNavigationToIntroScreen)
      )
  }
)

export const finishLoginActionAtom = atom(
  null,
  (
    get,
    set,
    {
      verifyPhoneNumberResponse,
      privateKey,
      phoneNumber,
    }: {
      verifyPhoneNumberResponse: VerifyPhoneNumberResponse
      privateKey: KeyHolder.PrivateKeyHolder
      phoneNumber: E164PhoneNumber
    }
  ) => {
    const {t} = get(translationAtom)
    const publicUser = get(apiAtom).user

    set(contactsMigratedAtom, true)

    return Effect.gen(function* (_) {
      const signature = yield* _(
        ecdsaSignE(privateKey.privateKeyPemBase64)(
          verifyPhoneNumberResponse.challenge
        )
      )

      const verifiedChallengeResponse = yield* _(
        publicUser.verifyChallenge({
          userPublicKey: privateKey.publicKeyPemBase64,
          signature: Schema.decodeSync(EcdsaSignature)(signature),
        })
      )

      const session = yield* _(
        Schema.decode(SessionE)({
          version: 1,
          sessionCredentials: {
            publicKey: privateKey.publicKeyPemBase64,
            hash: verifiedChallengeResponse.hash,
            signature: verifiedChallengeResponse.signature,
          },
          phoneNumber,
          privateKey,
        })
      )

      const contactApi = yield* _(
        contact.api({
          platform,
          clientVersion: versionCode,
          clientSemver: version,
          url: apiEnv.contactMs,
          getUserSessionCredentials: () => session.sessionCredentials,
          isDeveloper: get(isDeveloperAtom),
          language: get(translationAtom).t('localeName'),
          appSource,
        })
      )

      const userExists = yield* _(
        contactApi.checkUserExists({
          notifyExistingUserAboutLogin: true,
        })
      )

      if (userExists.exists) {
        yield* _(
          set(askAreYouSureActionAtom, {
            variant: 'info',
            steps: [
              {
                type: 'StepWithText',
                title: t('loginFlow.userAlreadyExists'),
                description: t('loginFlow.phoneNumberPreviouslyRegistered'),
                negativeButtonText: t('common.cancel'),
                positiveButtonText: t('common.continue'),
              },
            ],
          })
        ).pipe(
          Effect.matchEffect({
            onSuccess: () =>
              set(handleUserCreationActionAtom, {
                session,
              }),
            onFailure: () => set(deleteUserAndResetFlowActionAtom, {session}),
          })
        )
      } else {
        yield* _(
          set(handleUserCreationActionAtom, {
            session,
          })
        )
      }

      set(defaultCurrencyBaseOnCountryCodeActionAtom)
    }).pipe(
      Effect.provide(FetchHttpClient.layer),
      Effect.catchAll((e) => {
        const a: (arg: typeof e) => Effect.Effect<void> = Match.type<
          typeof e
        >().pipe(
          Match.tag(
            'VerificationNotFoundError',
            (e): Effect.Effect<void> =>
              Effect.sync(() => {
                reportError('error', new Error('Verification not found'), {e})
                showErrorAlert({
                  title: t(
                    'loginFlow.verificationCode.errors.verificationNotFound'
                  ),
                  error: e,
                })
              })
          ),
          Match.tag(
            'UnableToGenerateSignatureError',
            (e): Effect.Effect<void> =>
              Effect.sync(() => {
                reportError(
                  'error',
                  new Error('Unable to generate signature'),
                  {
                    e,
                  }
                )
                showErrorAlert({
                  title: t(
                    'loginFlow.verificationCode.errors.challengeCouldNotBeGenerated'
                  ),
                })
              })
          ),
          Match.tag(
            'InvalidSignatureError',
            (e): Effect.Effect<void> =>
              Effect.sync(() => {
                reportError(
                  'error',
                  new Error(
                    'Public key or hash invalid while verifying challenge'
                  ),
                  {e}
                )
                showErrorAlert({
                  title: t(
                    'loginFlow.verificationCode.errors.challengeCouldNotBeGenerated'
                  ),
                })
              })
          ),
          Match.tag(
            'InvalidVerificationError',
            (e): Effect.Effect<void> =>
              Effect.sync(() => {
                reportError('error', new Error('Invalid verification error.'), {
                  e,
                })
                showErrorAlert({
                  title: t(
                    'loginFlow.verificationCode.errors.verificationExpired'
                  ),
                })
              })
          ),
          Match.tag(
            'CryptoError',
            (e): Effect.Effect<void> =>
              Effect.sync(() => {
                reportError('error', new Error('Crypto error.'), {
                  e,
                })
                showErrorAlert({
                  title: t('common.cryptoError'),
                })
              })
          ),
          Match.tag(
            'RequestError',
            'ResponseError',
            (e): Effect.Effect<void> => {
              return Effect.sync(() => {
                showErrorAlert({
                  title: t(`common.NetworkError`),
                  error: e,
                })
              })
            }
          ),
          Match.tag(
            'UnexpectedServerError',
            'NotFoundError',
            'UnauthorizedError',
            'HttpApiDecodeError',
            'ParseError',
            (e): Effect.Effect<void> =>
              Effect.sync(() => {
                reportError('error', new Error(e._tag), {e})
                showErrorAlert({
                  title: t(`common.${e._tag}`),
                  error: e,
                })
              })
          ),
          Match.orElse(
            (e): Effect.Effect<void> =>
              Effect.sync(() => {
                reportError(
                  'error',
                  new Error('Unknown client error', {cause: e}),
                  {e}
                )
                showErrorAlert({
                  title: t(`common.UnknownClientError`),
                  error: e,
                })
              })
          )
        )

        return a(e).pipe(
          Effect.andThen(() => {
            resetNavigationToIntroScreen()
          })
        )
      })
    )
  }
)
