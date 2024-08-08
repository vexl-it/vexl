import {
  UnableToVerifySmsCodeError,
  VerifyCodeEndpoint,
  VerifyCodeErrors,
  VerifyPhoneNumberResponse,
} from '@vexl-next/rest-api/src/services/user/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {TwilioVerificationClient} from '../../../utils/twilio'
import {VerificationStateDbService} from '../db/verificationStateDb'
import {type ChallengeVerificationState} from '../domain'
import {generateVerificationChallenge} from '../utils/generateVerificationChallenge'

export const verifyCodeHandler = Handler.make(VerifyCodeEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const loginDb = yield* _(VerificationStateDbService)
      const loginData = yield* _(
        loginDb.retrievePhoneVerificationState(req.body.id)
      )

      if (
        loginData.type === 'staticCodeVerification' &&
        loginData.code !== req.body.code
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
        const twilio = yield* _(TwilioVerificationClient)
        yield* _(
          twilio.checkVerification({sid: loginData.sid, code: req.body.code})
        )
      }

      const verificationState = {
        publicKey: req.body.userPublicKey,
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
    }).pipe(Effect.withSpan('verifyCodeHandler', {attributes: {req}})),
    VerifyCodeErrors
  )
)
