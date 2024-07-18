import {Schema} from '@effect/schema'
import {fromMilliseconds} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  InitPhoneVerificationResponse,
  InitVerificationEndpoint,
  InitVerificationErrors,
  PhoneNumberVerificationId,
} from '@vexl-next/rest-api/src/services/user/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {loginCodeDummies, loginCodeDummyForAll} from '../../../configs'
import {TwilioVerificationClient} from '../../../utils/twilio'
import {VERIFICATION_EXPIRES_AFTER_MILIS} from '../constants'
import {VerificationStateDbService} from '../db/verificationStateDb'

const generateVerificationId = (): PhoneNumberVerificationId =>
  Schema.decodeSync(PhoneNumberVerificationId)(
    Math.round(Number(`${Date.now()}${Math.round(Math.random() * 100)}`))
  )

export const initVerificationHandler = Handler.make(
  InitVerificationEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const twilio = yield* _(TwilioVerificationClient)
        const loginDbService = yield* _(VerificationStateDbService)
        const expirationAt = unixMillisecondsFromNow(
          VERIFICATION_EXPIRES_AFTER_MILIS
        )

        const dummyCodeForAll = yield* _(loginCodeDummyForAll)

        if (Option.isSome(dummyCodeForAll)) {
          const verificationState = {
            type: 'staticCodeVerification' as const,
            id: generateVerificationId(),
            expiresAt: expirationAt,
            phoneNumber: req.body.phoneNumber,
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
            phoneNumber: req.body.phoneNumber,
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

        const sid = yield* _(twilio.createVerification(req.body.phoneNumber))
        const verificationState = {
          id: generateVerificationId(),
          type: 'twilioSmsVerification' as const,
          expiresAt: expirationAt,
          phoneNumber: req.body.phoneNumber,
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
