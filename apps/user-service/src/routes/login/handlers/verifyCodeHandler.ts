import {
  UnableToVerifySmsCodeError,
  VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'
import {checkVerification} from '../../../utils/smsVerificationUtils'
import {VerificationStateDbService} from '../db/verificationStateDb'
import {type ChallengeVerificationState} from '../domain'
import {generateVerificationChallenge} from '../utils/generateVerificationChallenge'

export const verifyCodeHandler = makeHttpApiHandler(
  UserApiSpecification,
  'Login',
  'verifyCode',
  (req) =>
    Effect.gen(function* () {
      const loginDb = yield* VerificationStateDbService
      const loginData = yield* loginDb.retrievePhoneVerificationState(
        req.payload.id
      )

      if (
        loginData.type === 'staticCodeVerification' &&
        loginData.code !== req.payload.code
      ) {
        return yield* Effect.fail(
          new UnableToVerifySmsCodeError({
            reason: 'BadCode',
            status: 400,
            code: '100104',
          })
        )
      } else if (loginData.type === 'twilioSmsVerification') {
        yield* checkVerification({sid: loginData.sid, code: req.payload.code})
      }

      const verificationState = {
        publicKey: req.payload.userPublicKey,
        phoneNumber: loginData.phoneNumber,
        expiresAt: loginData.expiresAt,
        countryPrefix: loginData.countryPrefix,
        challenge: yield* generateVerificationChallenge(),
      } satisfies ChallengeVerificationState

      yield* loginDb.storeChallengeVerificationState(verificationState)
      yield* loginDb.deletePhoneVerificationState(req.payload.id)

      return new VerifyPhoneNumberResponse({
        challenge: verificationState.challenge,
        phoneVerified: true,
      })
    }).pipe(Effect.withSpan('verifyCodeHandler'), makeEndpointEffect)
)
