import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {InvalidLoginSignatureError} from '@vexl-next/domain/src/general/loginChallenge'
import {fromMilliseconds} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  InitPhoneVerificationResponse,
  InitVerificationErrors,
  PhoneNumberVerificationId,
  UnsupportedVersionToLoginError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {InitVerificationEndpoint} from '@vexl-next/rest-api/src/services/user/specification'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {verifyLoginChallenge} from '@vexl-next/server-utils/src/loginChallengeServerOperations'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {type ConfigError, Effect, Option, Schema} from 'effect'
import {Handler} from 'effect-http'
import {
  allowLoginWithoutChallengeConfig,
  loginCodeDummies,
  loginCodeDummyForAll,
  lowestSupportVersionToLoginConfig,
} from '../../../configs'
import {createVerification} from '../../../utils/smsVerificationUtils'
import {VERIFICATION_EXPIRES_AFTER_MILIS} from '../constants'
import {VerificationStateDbService} from '../db/verificationStateDb'

const generateVerificationId = (): PhoneNumberVerificationId =>
  Schema.decodeSync(PhoneNumberVerificationId)(
    Math.round(Number(`${Date.now()}${Math.round(Math.random() * 100)}`))
  )

const checkClientVersion = (
  clientVersion: Option.Option<VersionCode>
): Effect.Effect<
  void,
  | UnsupportedVersionToLoginError
  | ConfigError.ConfigError
  | UnexpectedServerError
> =>
  Effect.gen(function* (_) {
    const lowestSupportedVersion = yield* _(lowestSupportVersionToLoginConfig)
    if (
      Option.isNone(clientVersion) ||
      clientVersion.value < lowestSupportedVersion
    ) {
      return yield* _(
        new UnsupportedVersionToLoginError({
          lowestRequiredVersion: lowestSupportedVersion,
          status: 400,
        })
      )
    }
  }).pipe(
    Effect.catchTag(
      'ParseError',
      (e) =>
        new UnexpectedServerError({
          status: 500,
          cause: e,
          detail: 'LowestSupportedVersionToLoginConfig is not set',
        })
    )
  )

export const initVerificationHandler = Handler.make(
  InitVerificationEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        yield* _(checkClientVersion(req.headers.clientVersionOrNone))
        const allowLoginWithoutChallenge = yield* _(
          allowLoginWithoutChallengeConfig
        )
        if (!allowLoginWithoutChallenge) {
          if (!req.body.challenge)
            return yield* _(
              new InvalidLoginSignatureError({
                status: 400,
              })
            )
          yield* _(
            verifyLoginChallenge({
              clientSignature: req.body.challenge.clientSignature,
              serverSignature: req.body.challenge.serverSignature,
              encodedChallenge: req.body.challenge.challenge,
            })
          )
        }

        const loginDbService = yield* _(VerificationStateDbService)
        const expirationAt = unixMillisecondsFromNow(
          VERIFICATION_EXPIRES_AFTER_MILIS
        )

        const phoneNumberHashed = yield* _(
          hashPhoneNumber(req.body.phoneNumber),
          Effect.catchTag(
            'CryptoError',
            () =>
              new UnexpectedServerError({
                status: 500,
                detail: 'Error while hasing phone number',
              })
          )
        )

        const countryPrefix = yield* _(
          countryPrefixFromNumber(req.body.phoneNumber),
          Effect.catchTag(
            'UnknownCountryPrefix',
            () =>
              new UnexpectedServerError({
                status: 500,
                detail: 'Unknown country prefix',
              })
          )
        )

        const dummyCodeForAll = yield* _(loginCodeDummyForAll)

        if (Option.isSome(dummyCodeForAll)) {
          const verificationState = {
            type: 'staticCodeVerification' as const,
            id: generateVerificationId(),
            expiresAt: expirationAt,
            countryPrefix,
            phoneNumber: phoneNumberHashed,
            code: dummyCodeForAll.value,
          }

          yield* _(
            loginDbService.storePhoneVerificationState(verificationState)
          )

          return new InitPhoneVerificationResponse({
            expirationAt: fromMilliseconds(expirationAt),
            verificationId: verificationState.id,
          })
        }

        const dummyNumbers = yield* _(loginCodeDummies)

        if (
          Option.isSome(dummyNumbers) &&
          dummyNumbers.value.numbers.includes(req.body.phoneNumber)
        ) {
          const verificationState = {
            type: 'staticCodeVerification' as const,
            id: generateVerificationId(),
            expiresAt: expirationAt,
            phoneNumber: phoneNumberHashed,
            countryPrefix,
            code: dummyNumbers.value.code,
          }

          yield* _(
            loginDbService.storePhoneVerificationState(verificationState)
          )
          return new InitPhoneVerificationResponse({
            expirationAt: fromMilliseconds(expirationAt),
            verificationId: verificationState.id,
          })
        }

        const sid = yield* _(
          createVerification(req.body.phoneNumber, req.headers)
        )
        const verificationState = {
          id: generateVerificationId(),
          type: 'twilioSmsVerification' as const,
          expiresAt: expirationAt,
          phoneNumber: phoneNumberHashed,
          countryPrefix,
          sid,
        }

        yield* _(loginDbService.storePhoneVerificationState(verificationState))

        return new InitPhoneVerificationResponse({
          expirationAt: fromMilliseconds(expirationAt),
          verificationId: verificationState.id,
        })
      }).pipe(Effect.withSpan('initVerificationHandler', {attributes: {req}})),
      InitVerificationErrors
    )
)
