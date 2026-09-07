import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {fromMilliseconds} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  InitPhoneVerificationResponse,
  PhoneNumberVerificationId,
  UnableToSendVerificationSmsError,
  UnsupportedVersionToLoginError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {verifyLoginChallenge} from '@vexl-next/server-utils/src/loginChallengeServerOperations'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, Option, pipe, Schema, String, type Config} from 'effect'
import {
  loginCodeDummies,
  loginCodeDummyForAll,
  lowestSupportVersionToLoginConfig,
} from '../../../configs'
import {createVerification} from '../../../utils/smsVerificationUtils'
import {VERIFICATION_EXPIRES_AFTER_MILIS} from '../constants'
import {VerificationStateDbService} from '../db/verificationStateDb'
import {type PhoneVerificationState} from '../domain'

type StaticCodeVerificationState = Extract<
  PhoneVerificationState,
  {type: 'staticCodeVerification'}
>
type TwilioSmsVerificationState = Extract<
  PhoneVerificationState,
  {type: 'twilioSmsVerification'}
>

const generateVerificationId = (): PhoneNumberVerificationId =>
  Schema.decodeSync(PhoneNumberVerificationId)(
    Math.round(Number(`${Date.now()}${Math.round(Math.random() * 100)}`))
  )

const makeStaticCodeVerificationState = (
  args: Omit<StaticCodeVerificationState, 'type'>
): StaticCodeVerificationState => ({
  ...args,
  type: 'staticCodeVerification',
})

const makeTwilioSmsVerificationState = (
  args: Omit<TwilioSmsVerificationState, 'type'>
): TwilioSmsVerificationState => ({
  ...args,
  type: 'twilioSmsVerification',
})

const checkClientVersion = (
  clientVersion: Option.Option<VersionCode>
): Effect.Effect<
  void,
  UnsupportedVersionToLoginError | Config.ConfigError | UnexpectedServerError
> =>
  Effect.gen(function* () {
    const lowestSupportedVersion = yield* lowestSupportVersionToLoginConfig
    if (
      Option.isNone(clientVersion) ||
      clientVersion.value < lowestSupportedVersion
    ) {
      return yield* new UnsupportedVersionToLoginError({
        lowestRequiredVersion: lowestSupportedVersion,
        status: 400,
      })
    }
  }).pipe(
    Effect.catchTag(
      'SchemaError',
      (e) =>
        new UnexpectedServerError({
          status: 500,
          cause: e,
          message: 'LowestSupportedVersionToLoginConfig is not set',
        })
    )
  )

export const initVerificationHandler = makeHttpApiHandler(
  UserApiSpecification,
  'Login',
  'initVerification',
  (req) =>
    Effect.gen(function* () {
      yield* checkClientVersion(req.headers.clientVersionOrNone)

      yield* verifyLoginChallenge({
        clientSignature: req.payload.challenge.clientSignature,
        serverSignature: req.payload.challenge.serverSignature,
        encodedChallenge: req.payload.challenge.challenge,
      })

      if (
        pipe(
          req.headers.deviceModelOrNone,
          Option.getOrElse(() => ''),
          String.toLowerCase
        ) === 'mainline'
      )
        return yield* new UnableToSendVerificationSmsError({
          reason: 'AntiFraudBlock',
          status: 400,
        })

      const loginDbService = yield* VerificationStateDbService
      const expirationAt = unixMillisecondsFromNow(
        VERIFICATION_EXPIRES_AFTER_MILIS
      )

      const phoneNumberHashed = yield* pipe(
        hashPhoneNumber(req.payload.phoneNumber),
        Effect.catchTag(
          'CryptoError',
          () =>
            new UnexpectedServerError({
              status: 500,
              message: 'Error while hasing phone number',
            })
        )
      )

      const countryPrefix = yield* pipe(
        countryPrefixFromNumber(req.payload.phoneNumber),
        Effect.catchTag(
          'UnknownCountryPrefix',
          () =>
            new UnexpectedServerError({
              status: 500,
              message: 'Unknown country prefix',
            })
        )
      )

      const dummyCodeForAll = yield* loginCodeDummyForAll

      if (Option.isSome(dummyCodeForAll)) {
        const verificationState = makeStaticCodeVerificationState({
          id: generateVerificationId(),
          expiresAt: expirationAt,
          countryPrefix,
          phoneNumber: phoneNumberHashed,
          code: dummyCodeForAll.value,
        })

        yield* loginDbService.storePhoneVerificationState(verificationState)

        return new InitPhoneVerificationResponse({
          expirationAt: fromMilliseconds(expirationAt),
          verificationId: verificationState.id,
        })
      }

      const dummyNumbers = yield* loginCodeDummies

      if (
        Option.isSome(dummyNumbers) &&
        dummyNumbers.value.numbers.includes(req.payload.phoneNumber)
      ) {
        const verificationState = makeStaticCodeVerificationState({
          id: generateVerificationId(),
          expiresAt: expirationAt,
          phoneNumber: phoneNumberHashed,
          countryPrefix,
          code: dummyNumbers.value.code,
        })

        yield* loginDbService.storePhoneVerificationState(verificationState)
        return new InitPhoneVerificationResponse({
          expirationAt: fromMilliseconds(expirationAt),
          verificationId: verificationState.id,
        })
      }

      const verificationStateBase = {
        id: generateVerificationId(),
        expiresAt: expirationAt,
        phoneNumber: phoneNumberHashed,
        countryPrefix,
      }

      const sid = yield* createVerification(
        req.payload.phoneNumber,
        req.headers
      )
      const verificationState = makeTwilioSmsVerificationState({
        ...verificationStateBase,
        sid,
      })

      yield* loginDbService.storePhoneVerificationState(verificationState)

      return new InitPhoneVerificationResponse({
        expirationAt: fromMilliseconds(expirationAt),
        verificationId: verificationState.id,
      })
    }).pipe(Effect.withSpan('initVerificationHandler'), makeEndpointEffect)
)
