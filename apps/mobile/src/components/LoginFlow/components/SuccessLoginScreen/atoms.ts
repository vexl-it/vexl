import {Schema} from '@effect/schema'
import * as crypto from '@vexl-next/cryptography/src'
import {type KeyHolder} from '@vexl-next/cryptography/src'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {contact, user} from '@vexl-next/rest-api/src'
import {type UserSessionCredentials} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {type CreateUserRequest} from '@vexl-next/rest-api/src/services/contact/contracts'
import {
  type VerifyChallengeInput,
  type VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect} from 'effect'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom, apiEnv, platform} from '../../../../api'
import {Session} from '../../../../brands/Session.brand'
import {sessionAtom} from '../../../../state/session'
import {version, versionCode} from '../../../../utils/environment'
import {safeParse} from '../../../../utils/fpUtils'
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

export const createUserAtContactMsActionAtom = atom(
  null,
  (
    get,
    set,
    {
      request,
      credentials,
    }: {request: CreateUserRequest; credentials: UserSessionCredentials}
  ) => {
    const {t} = get(translationAtom)
    const contactApi = contact.api({
      platform,
      clientVersion: versionCode,
      clientSemver: version,
      url: apiEnv.contactMs,
      getUserSessionCredentials: () => credentials,
    })

    return pipe(
      effectToTaskEither(contactApi.createUser({body: request})),
      TE.mapLeft((l) => {
        switch (l._tag) {
          // case 'UnexpectedApiResponseErrorAxios':
          //   return t('common.unexpectedServerResponse')
          // case 'NetworkError':
          //   return toCommonErrorMessage(l, t) ?? t('common.unknownError')
          case 'UnknownClientError':
          case 'UnknownServerError':
          case 'NotFoundError':
            return t('common.unknownError')
        }
      })
    )
  }
)

export const verifyChallengeActionAtom = atom(
  null,
  (get, set, verifyChallengeInput: VerifyChallengeInput) => {
    const {t} = get(translationAtom)
    const publicUser = get(apiAtom).user

    return publicUser.verifyChallenge(verifyChallengeInput).pipe(
      Effect.catchTags({
        VerificationNotFoundError: () =>
          Effect.fail(
            t('loginFlow.verificationCode.errors.verificationNotFound')
          ),
        UnableToGenerateSignatureError: () =>
          Effect.fail(
            t('loginFlow.verificationCode.errors.challengeCouldNotBeGenerated')
          ),
        InvalidSignatureError: (e) => {
          reportError(
            'error',
            new Error('Public key or hash invalid while verifying challenge'),
            {e}
          )
          return Effect.fail(
            t('loginFlow.verificationCode.errors.challengeCouldNotBeGenerated')
          )
        },
        UnexpectedApiResponseError: (e) => {
          reportError(
            'error',
            new Error('Unexpected api response while verifying challenge'),
            {e}
          )
          return Effect.fail(t('common.unexpectedServerResponse'))
        },
      }),
      Effect.catchAll((e) => {
        reportError('error', new Error('Error while verifying challenge'), {e})
        return Effect.fail(t('common.unknownError'))
      })
    )
  }
)

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

    return pipe(
      TE.Do,
      TE.chainFirstW(() =>
        set(createUserAtContactMsActionAtom, {
          request: {firebaseToken: null},
          credentials: session.sessionCredentials,
        })
      ),
      TE.match(
        (e) => {
          reportError('error', new Error('Error creating user at contact MS'), {
            e,
          })
          resetNavigationToIntroScreen()
          return false
        },
        () => {
          const leftToWait = TARGET_TIME_MILLISECONDS - (Date.now() - startedAt)
          if (leftToWait > 0)
            setTimeout(() => {
              set(sessionAtom, O.some(session))
            }, leftToWait)
          else set(sessionAtom, O.some(session))

          return true
        }
      )
    )()
  }
)

const deleteUserAndResetFlowActionAtom = atom(
  null,
  async (get, set, {session}: {session: Session}) => {
    await pipe(
      TE.Do,
      TE.chain(() => {
        const userApi = user.api({
          platform,
          clientSemver: version,
          clientVersion: versionCode,
          url: apiEnv.userMs,
          getUserSessionCredentials: () => session.sessionCredentials,
        })

        return effectToTaskEither(userApi.deleteUser())
      }),
      TE.match(
        (e) => {
          reportError('error', new Error('Error deleting user in onboarding'), {
            e,
          })
          return false
        },
        () => {
          return true
        }
      ),
      T.map(resetNavigationToIntroScreen)
    )()
  }
)

const handleUserExistsUIActionAtom = atom(
  null,
  (
    get,
    set,
    {
      userExists,
      session,
    }: {
      userExists: boolean
      session: Session
    }
  ) => {
    const {t} = get(translationAtom)

    if (userExists) {
      return pipe(
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
        }),
        TE.match(
          () => {
            void set(deleteUserAndResetFlowActionAtom, {session})
          },
          () => {
            void set(handleUserCreationActionAtom, {
              session,
            })
          }
        )
      )()
    }

    return set(handleUserCreationActionAtom, {
      session,
    })
  }
)

export const finishLoginActionAtom = atom(
  null,
  async (
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

    set(contactsMigratedAtom, true)

    await pipe(
      E.right(privateKey),
      E.bindTo('privateKey'),
      E.bindW('signature', ({privateKey}) =>
        E.tryCatch(
          () =>
            crypto.ecdsa.ecdsaSign({
              privateKey: privateKey.privateKeyPemBase64,
              challenge: verifyPhoneNumberResponse.challenge,
            }),

          (error) => {
            reportError(
              'error',
              new Error('error while signing login challenge'),
              {error}
            )
            return t('common.cryptoError')
          }
        )
      ),
      TE.fromEither,
      TE.bindW('verifyChallengeResponse', ({privateKey, signature}) =>
        effectToTaskEither(
          set(verifyChallengeActionAtom, {
            body: {
              userPublicKey: privateKey.publicKeyPemBase64,
              signature: Schema.decodeSync(EcdsaSignature)(signature),
            },
          })
        )
      ),
      TE.chainW(({verifyChallengeResponse}) => {
        return pipe(
          E.right<never, Zod.input<typeof Session>>({
            version: 1,
            sessionCredentials: {
              publicKey: privateKey.publicKeyPemBase64,
              hash: verifyChallengeResponse.hash,
              signature: verifyChallengeResponse.signature,
            },
            phoneNumber,
            privateKey,
          }),
          E.chainW(safeParse(Session)),
          E.mapLeft((error) => {
            reportError('error', new Error('Error while creating session'), {
              error,
            })
            return t('common.unknownError')
          }),
          TE.fromEither
        )
      }),
      TE.bindTo('session'),
      TE.bindW('userExists', ({session}) => {
        const contactApi = contact.api({
          platform,
          clientVersion: versionCode,
          clientSemver: version,
          url: apiEnv.contactMs,
          getUserSessionCredentials: () => session.sessionCredentials,
        })

        return effectToTaskEither(
          contactApi.checkUserExists({
            query: {notifyExistingUserAboutLogin: true},
          })
        )
      }),
      TE.match(
        (e) => {
          reportError(
            'error',
            new Error('Error when creating user session on login'),
            {e}
          )
          showErrorAlert({
            title: t('common.unknownError'),
            error: e,
          })
          resetNavigationToIntroScreen()
        },
        ({userExists, session}) => {
          return set(handleUserExistsUIActionAtom, {
            session,
            userExists: userExists.exists,
          })
        }
      )
    )()
  }
)
