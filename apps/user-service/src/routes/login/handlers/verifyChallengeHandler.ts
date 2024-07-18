import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {countryPrefixFromNumber} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type EcdsaSignature,
  ecdsaVerifyE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  InvalidSignatureError,
  UnableToGenerateSignatureError,
  type VerificationChallenge,
  VerifyChallengeEndpoint,
  VerifyChallengeErrors,
  VerifyChallengeResponse,
} from '@vexl-next/rest-api/src/services/user/specification'
import {generateUserAuthData} from '@vexl-next/server-utils/src/generateUserAuthData'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {LoggedInUsersDbService} from '../../../db/loggedInUsersDb'
import {VerificationStateDbService} from '../db/verificationStateDb'
import {DashboardReportsService} from '../utils/DashboardReportsService'

const insertUserIntoDb = (
  userPublicKey: PublicKeyPemBase64,
  phoneNumber: E164PhoneNumber
): Effect.Effect<void, UnexpectedServerError, LoggedInUsersDbService> =>
  Effect.gen(function* (_) {
    const usersDb = yield* _(LoggedInUsersDbService)
    const countryPrefix = yield* _(
      countryPrefixFromNumber(phoneNumber),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.log('Unable to get country prefix from number', e.number),
          Effect.succeed(undefined)
        )
      )
    )
    yield* _(usersDb.insertUser({publicKey: userPublicKey, countryPrefix}))
  })

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
            phoneNumber: verificationState.phoneNumber,
            publicKey: userPublicKey,
          }),
          Effect.catchTag('CryptoError', () =>
            Effect.fail(
              new UnableToGenerateSignatureError({code: '100105', status: 400})
            )
          )
        )

        yield* _(insertUserIntoDb(userPublicKey, verificationState.phoneNumber))
        yield* _(
          DashboardReportsService,
          Effect.flatMap((dashboardReportsService) =>
            dashboardReportsService.reportNewUserCreated()
          )
        )
        yield* _(
          loginDb.deleteChallengeVerificationState(req.body.userPublicKey)
        )

        return new VerifyChallengeResponse({
          ...authData,
          challengeVerified: true,
        })
      }).pipe(Effect.withSpan('verifyChallengeHandler', {attributes: {req}})),
      VerifyChallengeErrors
    )
)
