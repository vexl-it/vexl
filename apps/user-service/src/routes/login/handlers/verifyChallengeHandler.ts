import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type EcdsaSignature,
  ecdsaVerifyE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  InvalidSignatureError,
  UnableToGenerateSignatureError,
  type VerificationChallenge,
  VerifyChallengeErrors,
  VerifyChallengeResponse,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {VerifyChallengeEndpoint} from '@vexl-next/rest-api/src/services/user/specification'
import {DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {generateUserAuthData} from '@vexl-next/server-utils/src/generateUserAuthData'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Metric} from 'effect'
import {Handler} from 'effect-http'
import {LoggedInUsersDbService} from '../../../db/loggedInUsersDb'
import {makeUserLoggedInCounter} from '../../../metrics'
import {VerificationStateDbService} from '../db/verificationStateDb'

const insertUserIntoDb = (
  userPublicKey: PublicKeyPemBase64,
  countryPrefix: CountryPrefix
): Effect.Effect<void, UnexpectedServerError, LoggedInUsersDbService> =>
  LoggedInUsersDbService.pipe(
    Effect.flatMap((userDb) =>
      userDb.insertUser({publicKey: userPublicKey, countryPrefix})
    )
  )

const verifySignature = (
  signature: EcdsaSignature,
  userPublicKey: PublicKeyPemBase64,
  challenge: VerificationChallenge
): Effect.Effect<true, InvalidSignatureError> =>
  ecdsaVerifyE(userPublicKey)({
    data: challenge,
    signature,
  }).pipe(
    Effect.catchTag('CryptoError', () =>
      Effect.fail(new InvalidSignatureError({code: '100108', status: 400}))
    ),
    Effect.filterOrFail(
      (a): a is true => a,
      () => new InvalidSignatureError({code: '100108', status: 400})
    )
  )

export const verifyChallengeHandler = Handler.make(
  VerifyChallengeEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const loginDb = yield* _(VerificationStateDbService)
        const verificationState = yield* _(
          loginDb.retrieveChallengeVerificationState(req.body.userPublicKey)
        )

        const {signature, userPublicKey} = req.body
        yield* _(
          verifySignature(signature, userPublicKey, verificationState.challenge)
        )

        const authData = yield* _(
          generateUserAuthData({
            phoneNumberHashed: verificationState.phoneNumber,
            publicKey: userPublicKey,
          }),
          Effect.catchTag('CryptoError', () =>
            Effect.fail(
              new UnableToGenerateSignatureError({code: '100105', status: 400})
            )
          )
        )

        yield* _(
          insertUserIntoDb(userPublicKey, verificationState.countryPrefix)
        )
        yield* _(
          DashboardReportsService,
          Effect.flatMap((dashboardReportsService) =>
            dashboardReportsService.reportNewUserCreated()
          )
        )
        yield* _(
          loginDb.deleteChallengeVerificationState(req.body.userPublicKey)
        )

        yield* _(
          Metric.increment(
            makeUserLoggedInCounter(verificationState.countryPrefix)
          )
        )

        return new VerifyChallengeResponse({
          ...authData,
          challengeVerified: true,
        })
      }).pipe(Effect.withSpan('verifyChallengeHandler', {attributes: {req}})),
      VerifyChallengeErrors
    )
)
