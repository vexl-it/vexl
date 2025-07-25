import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  UnableToVerifySmsCodeError,
  VerifyAndEraseUserErrors,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {VerifyAndEraseUserEndpoint} from '@vexl-next/rest-api/src/services/user/specification'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {createShortLivedTokenForErasingUser} from '@vexl-next/server-utils/src/shortLivedTokenForErasingUserUtils'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {loginCodeDummyForAll} from '../../../configs'
import {TwilioVerificationClient} from '../../../utils/twilio'
import {validateAndDecodeVerificationId} from '../utils'

export const verifyAndEraseUser = Handler.make(
  VerifyAndEraseUserEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const verificationId = req.body.verificationId
        const twilio = yield* _(TwilioVerificationClient)

        const dummyCodeForAll = yield* _(loginCodeDummyForAll)
        const decodedVerificationId = yield* _(
          validateAndDecodeVerificationId(verificationId)
        )
        if (Option.isSome(dummyCodeForAll)) {
          if (dummyCodeForAll.value !== req.body.code)
            return yield* _(
              new UnableToVerifySmsCodeError({
                status: 400,
                code: '100104' as const,
                reason: 'BadCode' as const,
              })
            )
        } else {
          yield* _(
            twilio.checkVerification({
              code: req.body.code,
              sid: decodedVerificationId.verificationId,
            })
          )
        }
        return yield* _(
          hashPhoneNumber(decodedVerificationId.phoneNumber),
          Effect.flatMap((hashedPhoneNumber) =>
            createShortLivedTokenForErasingUser(hashedPhoneNumber)
          ),
          Effect.catchAll(
            (e) => new UnexpectedServerError({status: 500, cause: e})
          ),
          Effect.map((shortLivedTokenForErasingUserOnContactService) => ({
            shortLivedTokenForErasingUserOnContactService,
          }))
        )
      }).pipe(Effect.withSpan('verifyAndEraseUser', {attributes: {req}})),
      VerifyAndEraseUserErrors
    )
)
