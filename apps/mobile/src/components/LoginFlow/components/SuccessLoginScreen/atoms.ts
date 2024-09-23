import {Schema} from '@effect/schema'
import {type KeyHolder} from '@vexl-next/cryptography/src'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  EcdsaSignature,
  ecdsaSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {taskEitherToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {contact, user} from '@vexl-next/rest-api/src'
import {UnknownClientError} from '@vexl-next/rest-api/src/Errors'
import {type VerifyPhoneNumberResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, Match} from 'effect'
import * as O from 'fp-ts/Option'
import {atom} from 'jotai'
import {apiAtom, apiEnv, platform} from '../../../../api'
import {type Session, SessionE} from '../../../../brands/Session.brand'
import {sessionAtom} from '../../../../state/session'
import {version, versionCode} from '../../../../utils/environment'
import {translationAtom} from '../../../../utils/localization/I18nProvider'
import {navigationRef} from '../../../../utils/navigation'
import reportError from '../../../../utils/reportError'
import showErrorAlert from '../../../../utils/showErrorAlert'
import {askAreYouSureActionAtom} from '../../../AreYouSureDialog'
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
    const contactApi = contact.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.contactMs,
      getUserSessionCredentials: () => session.sessionCredentials,
    })

    return contactApi.createUser({body: {firebaseToken: null}}).pipe(
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
    const userApi = user.api({
      platform,
      clientSemver: version,
      clientVersion: versionCode,
      url: apiEnv.userMs,
      getUserSessionCredentials: () => session.sessionCredentials,
    })

    return userApi.deleteUser().pipe(
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
          body: {
            userPublicKey: privateKey.publicKeyPemBase64,
            signature: Schema.decodeSync(EcdsaSignature)(signature),
          },
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
      ).pipe(
        Effect.catchTag('ParseError', (e) =>
          Effect.fail(
            new UnknownClientError({
              message:
                'Erro while parsing session data. Unable to normalize the session',
              cause: e,
            })
          )
        )
      )

      const contactApi = contact.api({
        platform,
        clientVersion: versionCode,
        clientSemver: version,
        url: apiEnv.contactMs,
        getUserSessionCredentials: () => session.sessionCredentials,
      })

      const userExists = yield* _(
        contactApi.checkUserExists({
          query: {notifyExistingUserAboutLogin: true},
        })
      )

      if (userExists.exists) {
        yield* _(
          taskEitherToEffect(
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
          )
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
    }).pipe(
      Effect.catchAll((e) => {
        Match.type<typeof e>().pipe(
          Match.tag('VerificationNotFoundError', (e) =>
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
          Match.tag('UnableToGenerateSignatureError', (e) =>
            Effect.sync(() => {
              reportError('error', new Error('Unable to generate signature'), {
                e,
              })
              showErrorAlert({
                title: t(
                  'loginFlow.verificationCode.errors.challengeCouldNotBeGenerated'
                ),
              })
            })
          ),
          Match.tag('InvalidSignatureError', (e) =>
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
          Match.tag('InvalidVerificationError', (e) =>
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
          Match.tag('CryptoError', (e) =>
            Effect.sync(() => {
              reportError('error', new Error('Crypto error.'), {
                e,
              })
              showErrorAlert({
                title: t('common.cryptoError'),
              })
            })
          ),
          Match.tag('NetworkError', (e) => {
            showErrorAlert({
              title: t(`common.${e._tag}`),
              error: e,
            })
          }),
          Match.tag(
            'HttpError',
            'UnknownClientError',
            'UnknownServerError',
            'NotFoundError',
            'UnauthorizedError',
            'UnexpectedApiResponseError',
            (e) =>
              Effect.sync(() => {
                reportError('error', new Error(e._tag), {e})
                showErrorAlert({
                  title: t(`common.${e._tag}`),
                  error: e,
                })
              })
          ),
          Match.exhaustive
        )

        resetNavigationToIntroScreen()

        return Effect.void
      })
    )
  }
)
