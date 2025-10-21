import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {loginCodeDummyForAll} from '../../../configs'
import {createVerification} from '../../../utils/smsVerificationUtils'
import {VERIFICATION_EXPIRES_AFTER_MILIS} from '../../login/constants'
import {createVerificationId, dummySid} from '../utils'

export const initEraseUserEndpoint = HttpApiBuilder.handler(
  UserApiSpecification,
  'EraseUser',
  'initEraseUser',
  (req) =>
    Effect.gen(function* (_) {
      const dummyCodeForAll = yield* _(loginCodeDummyForAll)

      let sid
      if (Option.isSome(dummyCodeForAll)) sid = dummySid
      else
        sid = yield* _(createVerification(req.payload.phoneNumber, req.headers))

      const verificationId = yield* _(
        createVerificationId({
          phoneNumber: req.payload.phoneNumber,
          verificationId: sid,
          expiresAt: unixMillisecondsFromNow(VERIFICATION_EXPIRES_AFTER_MILIS),
        })
      )
      return {verificationId}
    }).pipe(
      Effect.withSpan('initEraseUserEndpoint'),
      Effect.catchTags({
        CryptoError: (error) =>
          new UnexpectedServerError({
            cause: error,
            status: 500,
            message: 'crypto error',
          }),
        ParseError: (error) =>
          new UnexpectedServerError({
            cause: error,
            status: 500,
            message: 'parse error',
          }),
      }),
      makeEndpointEffect
    )
)
