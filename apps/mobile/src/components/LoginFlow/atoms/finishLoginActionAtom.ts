import {type KeyHolder} from '@vexl-next/cryptography/src'
import {type PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  EcdsaSignature,
  ecdsaSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {contact, user} from '@vexl-next/rest-api/src'
import {type VerifyPhoneNumberResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, Option, pipe, Schema} from 'effect'
import {FetchHttpClient} from 'effect/unstable/http'
import * as O from 'fp-ts/Option'
import {atom} from 'jotai'
import {apiAtom, apiEnv, platform} from '../../../api'
import {type Session, type SessionV2} from '../../../brands/Session.brand'
import {defaultCurrencyBaseOnCountryCodeActionAtom} from '../../../state/defaultCurrencyBaseOnCountryCodeActionAtom'
import {createVexlSecretActionAtom} from '../../../state/notifications/actions/createVexlSecretActionAtom'
import {generateVexlTokenActionAtom} from '../../../state/notifications/actions/generateVexlTokenActionAtom'
import {syncVexlNotificationTokensActionAtom} from '../../../state/notifications/actions/syncVexlNotificationTokensActionAtom'
import {vexlNotificationTokenAtom} from '../../../state/notifications/vexlNotificationTokenAtom'
import {sessionAtom} from '../../../state/session'
import {upgradeSession} from '../../../state/session/upgradeSession'
import {
  appSource,
  deviceModel,
  osVersion,
  version,
  versionCode,
} from '../../../utils/environment'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {beginMarketplaceReadyNotificationFlowActionAtom} from '../../../utils/marketplaceReadyNotification/store'
import {navigationRef} from '../../../utils/navigation'
import {getNotificationTokenE} from '../../../utils/notifications'
import {isDeveloperAtom} from '../../../utils/preferences'
import reportError from '../../../utils/reportError'
import {showErrorAlert} from '../../ErrorAlert'
import {globalDialogAtom} from '../../GlobalDialog'

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
      session: SessionV2
    }
  ) => {
    return Effect.gen(function* () {
      const startedAt = Date.now()

      const contactApi = yield* contact.api({
        platform,
        clientVersion: versionCode,
        clientSemver: version,
        url: apiEnv.contactMs,
        getUserSessionCredentials: () => session.sessionCredentials,
        appSource,
        language: get(translationAtom).t('localeName'),
        isDeveloper: get(isDeveloperAtom),
      })

      yield* contactApi.createUser({
        firebaseToken: null,
        expoToken: null,
        publicKeyV2: Option.none<PublicKeyV2>(),
        vexlNotificationToken: Option.fromNullishOr(
          session.sessionNotificationToken
        ),
      })

      const leftToWait = TARGET_TIME_MILLISECONDS - (Date.now() - startedAt)
      if (leftToWait > 0) {
        yield* Effect.promise(
          () =>
            new Promise<void>((resolve) => {
              setTimeout(resolve, leftToWait)
            })
        )
      }

      set(beginMarketplaceReadyNotificationFlowActionAtom)
      set(sessionAtom, O.some(session))
    }).pipe(
      Effect.tapError((e) => {
        reportError('error', new Error('Error creating user at contact MS'), {
          e,
        })
        resetNavigationToIntroScreen()
        return Effect.succeed(undefined)
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
        Effect.map(resetNavigationToIntroScreen)
      )
  }
)

const handleSecretTokenAndSessionTokenCreationActionAtom = atom(
  null,
  (get, set) =>
    Effect.gen(function* () {
      if (get(vexlNotificationTokenAtom).secret) {
        console.log(
          'Vexl notification secret already exists, this should not happen, lets remove it first'
        )

        set(vexlNotificationTokenAtom, {
          secret: null,
          systemVexlToken: null,
          marketingVexlToken: null,
          lastUpdatedMetadata: null,
        })
      }

      console.log('Vexl notification secret does not exist, creating...')
      const expoToken = yield* getNotificationTokenE()

      yield* pipe(
        set(createVexlSecretActionAtom, {
          expoNotificationToken: expoToken,
        }),
        Effect.result
      )

      console.log('Vexl notification secret created successfully')

      yield* set(syncVexlNotificationTokensActionAtom, {
        expoNotificationToken: expoToken,
      })

      const sessionNotificationToken = yield* pipe(
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

    return Effect.gen(function* () {
      const signature = yield* ecdsaSignE(privateKey.privateKeyPemBase64)(
        verifyPhoneNumberResponse.challenge
      )

      const verifiedChallengeResponse = yield* api.user.verifyChallenge({
        userPublicKey: privateKey.publicKeyPemBase64,
        signature: Schema.decodeSync(EcdsaSignature)(signature),
      })

      const sessionNotificationToken = yield* set(
        handleSecretTokenAndSessionTokenCreationActionAtom
      )

      const session = yield* upgradeSession({
        version: 1,
        sessionCredentials: {
          publicKey: privateKey.publicKeyPemBase64,
          hash: verifiedChallengeResponse.hash,
          signature: verifiedChallengeResponse.signature,
        },
        keyPairV2: undefined,
        phoneNumber,
        privateKey,
        sessionNotificationToken: Option.getOrUndefined(
          sessionNotificationToken
        ),
      })

      const contactApi = yield* contact.api({
        platform,
        clientVersion: versionCode,
        clientSemver: version,
        url: apiEnv.contactMs,
        getUserSessionCredentials: () => session.sessionCredentials,
        isDeveloper: get(isDeveloperAtom),
        language: get(translationAtom).t('localeName'),
        appSource,
      })

      const userExists = yield* contactApi.checkUserExists({
        notifyExistingUserAboutLogin: true,
      })

      if (userExists.exists) {
        const confirmed = yield* set(globalDialogAtom, {
          title: t('loginFlow.userAlreadyExists'),
          subtitle: t('loginFlow.phoneNumberPreviouslyRegistered'),
          negativeButtonText: t('common.cancel'),
          positiveButtonText: t('common.continue'),
        })

        if (confirmed) {
          yield* set(handleUserCreationActionAtom, {
            session,
          })
        } else {
          yield* set(deleteUserAndResetFlowActionAtom, {
            session,
          })
        }
      } else {
        yield* set(handleUserCreationActionAtom, {
          session,
        })
      }

      set(defaultCurrencyBaseOnCountryCodeActionAtom)
    }).pipe(
      Effect.provide(FetchHttpClient.layer),
      Effect.as(true),
      Effect.catch((e) => {
        const a: (arg: typeof e) => Effect.Effect<void> = (error) => {
          if (error._tag === 'VerificationNotFoundError') {
            const e = error
            return Effect.sync(() => {
              reportError('error', new Error('Verification not found'), {e})
              showErrorAlert({
                title: t(
                  'loginFlow.verificationCode.errors.verificationNotFound'
                ),
                error: e,
              })
            })
          }
          if (error._tag === 'UnableToGenerateSignatureError') {
            const e = error
            return Effect.sync(() => {
              reportError('error', new Error('Unable to generate signature'), {
                e,
              })
              showErrorAlert({
                title: t(
                  'loginFlow.verificationCode.errors.challengeCouldNotBeGenerated'
                ),
              })
            })
          }
          if (error._tag === 'InvalidSignatureError') {
            const e = error
            return Effect.sync(() => {
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
          }
          if (error._tag === 'InvalidVerificationError') {
            const e = error
            return Effect.sync(() => {
              reportError('error', new Error('Invalid verification error.'), {
                e,
              })
              showErrorAlert({
                title: t(
                  'loginFlow.verificationCode.errors.verificationExpired'
                ),
              })
            })
          }
          if (error._tag === 'CryptoError') {
            const e = error
            return Effect.sync(() => {
              reportError('error', new Error('Crypto error.'), {
                e,
              })
              showErrorAlert({
                title: t('common.cryptoError'),
              })
            })
          }
          if (
            error._tag === 'HttpClientError' &&
            error.reason._tag === 'TransportError'
          ) {
            const e = error
            return Effect.sync(() => {
              showErrorAlert({
                title: t(`common.NetworkError`),
                error: e,
              })
            })
          }
          if (
            error._tag === 'UnexpectedServerError' ||
            error._tag === 'NotFoundError' ||
            error._tag === 'UnauthorizedError' ||
            error._tag === 'SchemaError'
          ) {
            const e = error
            return Effect.sync(() => {
              reportError('error', new Error(e._tag), {e})
              showErrorAlert({
                title: t(
                  e._tag === 'SchemaError'
                    ? 'common.ParseError'
                    : `common.${e._tag}`
                ),
                error: e,
              })
            })
          }
          {
            const e = error
            return Effect.sync(() => {
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
          }
        }

        return a(e).pipe(
          Effect.andThen(() =>
            Effect.sync(() => {
              resetNavigationToIntroScreen()
            })
          ),
          Effect.as(false)
        )
      })
    )
  }
)
