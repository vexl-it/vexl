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
import * as O from 'fp-ts/Option'
import {atom} from 'jotai'
import {apiAtom, apiEnv, platform} from '../../../../api'
import {Session} from '../../../../brands/Session.brand'
import {defaultCurrencyBaseOnCountryCodeActionAtom} from '../../../../state/defaultCurrencyBaseOnCountryCodeActionAtom'
import {createVexlSecretActionAtom} from '../../../../state/notifications/actions/createVexlSecretActionAtom'
import {generateVexlTokenActionAtom} from '../../../../state/notifications/actions/generateVexlTokenActionAtom'
import {vexlNotificationTokenAtom} from '../../../../state/notifications/vexlNotificationTokenAtom'
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
import {getNotificationTokenE} from '../../../../utils/notifications'
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
          contactApi.createUser({
            firebaseToken: null,
            expoToken: null,
            vexlNotificationToken: Option.fromNullable(
              session.sessionNotificationToken
            ),
          })
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
              set(sessionAtom, O.some(session))
            }, leftToWait)
          else set(sessionAtom, O.some(session))
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

const handleSecretTokenAndSessionTokenCreationActionAtom = atom(
  null,
  (get, set) =>
    Effect.gen(function* (_) {
      if (get(vexlNotificationTokenAtom).secret) {
        console.log(
          'Vexl notification secret already exists, this should not happen, lets remove it first'
        )

        set(vexlNotificationTokenAtom, {
          secret: null,
          lastUpdatedMetadata: null,
        })
      }

      console.log('Vexl notification secret does not exist, creating...')
      const expoToken = yield* _(getNotificationTokenE())

      yield* _(
        set(createVexlSecretActionAtom, {
          expoNotificationToken: expoToken,
        }),
        Effect.either
      )

      console.log('Vexl notification secret created successfully')

      const sessionNotificationToken = yield* _(
        set(generateVexlTokenActionAtom),
        Effect.option
      )

      return sessionNotificationToken
    })
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
    const api = get(apiAtom)

    set(contactsMigratedAtom, true)

    return Effect.gen(function* (_) {
      const signature = yield* _(
        ecdsaSignE(privateKey.privateKeyPemBase64)(
          verifyPhoneNumberResponse.challenge
        )
      )

      const verifiedChallengeResponse = yield* _(
        api.user.verifyChallenge({
          userPublicKey: privateKey.publicKeyPemBase64,
          signature: Schema.decodeSync(EcdsaSignature)(signature),
        })
      )

      const sessionNotificationToken = yield* _(
        set(handleSecretTokenAndSessionTokenCreationActionAtom)
      )

      const session = yield* _(
        Schema.decode(Session)({
          version: 1,
          sessionCredentials: {
            publicKey: privateKey.publicKeyPemBase64,
            hash: verifiedChallengeResponse.hash,
            signature: verifiedChallengeResponse.signature,
          },
          phoneNumber,
          privateKey,
          sessionNotificationToken: Option.getOrUndefined(
            sessionNotificationToken
          ),
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
