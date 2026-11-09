import {HttpApiBuilder} from '@effect/platform/index'
import {VerifyPhoneNumberResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {VerificationStateDbService} from '../db/verificationStateDb'
import {consumePhoneVerification} from '../utils/consumePhoneVerification'
import {generateVerificationChallenge} from '../utils/generateVerificationChallenge'

export const verifyCodeHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'Login',
  'verifyCode',
  (req) =>
    Effect.gen(function* (_) {
      const loginDb = yield* _(VerificationStateDbService)
      const challenge = yield* _(generateVerificationChallenge())

      yield* _(
        consumePhoneVerification(req.payload, (loginData) =>
          loginDb.storeChallengeVerificationState({
            publicKey: req.payload.userPublicKey,
            phoneNumber: loginData.phoneNumber,
            expiresAt: loginData.expiresAt,
            countryPrefix: loginData.countryPrefix,
            challenge,
          })
        )
      )

      return new VerifyPhoneNumberResponse({challenge, phoneVerified: true})
    }).pipe(Effect.withSpan('verifyCodeHandler'), makeEndpointEffect)
)
