import {HttpApiBuilder} from '@effect/platform/index'
import {VerifyPhoneNumberResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {VerificationStateDbService} from '../db/verificationStateDb'
import {type ChallengeVerificationState} from '../domain'
import {consumePhoneVerification} from '../utils/consumePhoneVerification'
import {generateVerificationChallenge} from '../utils/generateVerificationChallenge'

export const verifyCodeHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'Login',
  'verifyCode',
  (req) =>
    Effect.gen(function* (_) {
      const loginDb = yield* _(VerificationStateDbService)
      const loginData = yield* _(consumePhoneVerification(req.payload))

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
