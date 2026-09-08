import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {UnableToVerifySmsCodeError} from '@vexl-next/rest-api/src/services/user/contracts'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {createShortLivedTokenForErasingUser} from '@vexl-next/server-utils/src/shortLivedTokenForErasingUserUtils'
import {Effect, Option, pipe, Schema} from 'effect'
import {loginCodeDummyForAll} from '../../../configs'
import {checkVerification} from '../../../utils/smsVerificationUtils'
import {validateAndDecodeVerificationId} from '../utils'

const USED_ERASE_VERIFICATION_ID_PREFIX = 'usedEraseVerificationId:'

export const verifyAndEraseUser = makeHttpApiHandler(
  UserApiSpecification,
  'EraseUser',
  'verifyAndEraseuser',
  (req) =>
    Effect.gen(function* () {
      const verificationId = req.payload.verificationId

      const dummyCodeForAll = yield* loginCodeDummyForAll
      const decodedVerificationId =
        yield* validateAndDecodeVerificationId(verificationId)
      const redis = yield* RedisService
      const usedVerificationIdRedisKey = `${USED_ERASE_VERIFICATION_ID_PREFIX}${verificationId}`

      if (Option.isSome(dummyCodeForAll)) {
        if (dummyCodeForAll.value !== req.payload.code)
          return yield* new UnableToVerifySmsCodeError({
            status: 400,
            code: '100104',
            reason: 'BadCode',
          })
      } else {
        yield* checkVerification({
          code: req.payload.code,
          sid: decodedVerificationId.verificationId,
        })
      }
      const verificationIdWasClaimed = yield* pipe(
        redis.setIfNotExists(Schema.Boolean)(usedVerificationIdRedisKey, true, {
          expiresAt: decodedVerificationId.expiresAt,
        }),
        Effect.catch((e) => new UnexpectedServerError({status: 500, cause: e}))
      )

      if (!verificationIdWasClaimed) {
        return yield* new UnableToVerifySmsCodeError({
          status: 400,
          code: '100104',
          reason: 'BadCode',
        })
      }

      return yield* pipe(
        hashPhoneNumber(decodedVerificationId.phoneNumber),
        Effect.flatMap((hashedPhoneNumber) =>
          createShortLivedTokenForErasingUser(hashedPhoneNumber)
        ),
        Effect.catch((e) => new UnexpectedServerError({status: 500, cause: e})),
        Effect.map((shortLivedTokenForErasingUserOnContactService) => ({
          shortLivedTokenForErasingUserOnContactService,
        }))
      )
    }).pipe(Effect.withSpan('verifyAndEraseUser'), makeEndpointEffect)
)
