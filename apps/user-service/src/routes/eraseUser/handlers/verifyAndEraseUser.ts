import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {UnableToVerifySmsCodeError} from '@vexl-next/rest-api/src/services/user/contracts'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {createShortLivedTokenForErasingUser} from '@vexl-next/server-utils/src/shortLivedTokenForErasingUserUtils'
import {Effect, Option} from 'effect'
import {loginCodeDummyForAll} from '../../../configs'
import {checkVerification} from '../../../utils/smsVerificationUtils'
import {validateAndDecodeVerificationId} from '../utils'

export const verifyAndEraseUser = HttpApiBuilder.handler(
  UserApiSpecification,
  'EraseUser',
  'verifyAndEraseuser',
  (req) =>
    Effect.gen(function* (_) {
      const verificationId = req.payload.verificationId

      const dummyCodeForAll = yield* _(loginCodeDummyForAll)
      const decodedVerificationId = yield* _(
        validateAndDecodeVerificationId(verificationId)
      )
      if (Option.isSome(dummyCodeForAll)) {
        if (dummyCodeForAll.value !== req.payload.code)
          return yield* _(
            new UnableToVerifySmsCodeError({
              status: 400,
              code: '100104' as const,
              reason: 'BadCode' as const,
            })
          )
      } else {
        yield* _(
          checkVerification({
            code: req.payload.code,
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
    }).pipe(Effect.withSpan('verifyAndEraseUser'), makeEndpointEffect)
)
