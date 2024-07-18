import {ecdsaVerifyE} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  InvalidSignatureError,
  UnableToGenerateSignatureError,
  VerifyChallengeEndpoint,
  VerifyChallengeErrors,
  VerifyChallengeResponse,
} from '@vexl-next/rest-api/src/services/user/specification'
import {generateUserAuthData} from '@vexl-next/server-utils/src/generateUserAuthData'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {deleteVerifyChallengeRequest} from '../db'
import {LoginDbService} from '../utils/db'

export const verifyChallengeHandler = Handler.make(
  VerifyChallengeEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const loginDb = yield* _(LoginDbService)
        const verificationState = yield* _(
          loginDb.retrieveChallengeVerificationState(req.body.userPublicKey)
        )

        const {signature, userPublicKey} = req.body
        const signatureValid = yield* _(
          ecdsaVerifyE(userPublicKey)({
            data: verificationState.challenge,
            signature,
          }),
          Effect.catchTag('CryptoError', () =>
            Effect.fail(
              new InvalidSignatureError({code: '100108', status: 400})
            )
          )
        )

        if (!signatureValid) {
          return yield* _(
            Effect.fail(
              new InvalidSignatureError({code: '100108', status: 400})
            )
          )
        }

        const authData = yield* _(
          generateUserAuthData({
            phoneNumber: verificationState.phoneNumber,
            publicKey: userPublicKey,
          }),
          Effect.catchTag('CryptoError', () =>
            Effect.fail(
              new UnableToGenerateSignatureError({code: '100105', status: 400})
            )
          )
        )

        yield* _(deleteVerifyChallengeRequest(req.body.userPublicKey))
        return new VerifyChallengeResponse({
          ...authData,
          challengeVerified: true,
        })
      }).pipe(Effect.withSpan('verifyChallengeHandler', {attributes: {req}})),
      VerifyChallengeErrors
    )
)
