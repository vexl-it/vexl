import {HttpApiBuilder} from '@effect/platform/index'
import {
  UnableToVerifySmsCodeError,
  VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {checkVerification} from '../../../utils/smsVerificationUtils'
import {VerificationStateDbService} from '../db/verificationStateDb'
import {type ChallengeVerificationState} from '../domain'
import {generateVerificationChallenge} from '../utils/generateVerificationChallenge'

export const verifyCodeHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'Login',
  'verifyCode',
  (req) =>
    Effect.gen(function* (_) {
      const loginDb = yield* _(VerificationStateDbService)
      const loginData = yield* _(
        loginDb.retrievePhoneVerificationState(req.payload.id)
      )

      if (
        loginData.type === 'staticCodeVerification' &&
        loginData.code !== req.payload.code
      ) {
        return yield* _(
          Effect.fail(
            new UnableToVerifySmsCodeError({
              reason: 'BadCode',
              status: 400,
              code: '100104',
            })
          )
        )
      } else if (loginData.type === 'twilioSmsVerification') {
        yield* _(
          checkVerification({sid: loginData.sid, code: req.payload.code})
        )
      }

      const verificationState = {
        publicKey: req.payload.userPublicKey,
        phoneNumber: loginData.phoneNumber,
        expiresAt: loginData.expiresAt,
        countryPrefix: loginData.countryPrefix,
        challenge: yield* _(generateVerificationChallenge()),
      } satisfies ChallengeVerificationState

      yield* _(loginDb.storeChallengeVerificationState(verificationState))

      return new VerifyPhoneNumberResponse({
        challenge: verificationState.challenge,
        phoneVerified: true,
      })
    }).pipe(Effect.withSpan('verifyCodeHandler'), makeEndpointEffect)
)
