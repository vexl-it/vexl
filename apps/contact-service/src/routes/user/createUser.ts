import {HttpApiBuilder} from '@effect/platform/index'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {
  MAX_PHONE_NUMBERS_PER_ACCOUNT,
  PhoneNumberLimitReachedError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option, pipe} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {reportUserLoggedIn} from '../../metrics'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {ensureLoginSessionProof} from './utils/ensureLoginSessionProof'

const ensureBelowPhoneNumberLimit = ({
  publicKey,
  hash,
}: {
  publicKey: PublicKeyPemBase64
  hash: ServerHashedNumber
}): Effect.Effect<
  void,
  PhoneNumberLimitReachedError | UnexpectedServerError,
  UserDbService
> =>
  Effect.gen(function* (_) {
    const userDb = yield* _(UserDbService)
    const otherNumbersCount = pipe(
      yield* _(userDb.findHashesByPublicKey(publicKey)),
      Array.filter((one) => one !== hash),
      Array.length
    )
    if (otherNumbersCount >= MAX_PHONE_NUMBERS_PER_ACCOUNT)
      return yield* _(Effect.fail(new PhoneNumberLimitReachedError()))
  })

const deleteIfExists = (
  hash: ServerHashedNumber
): Effect.Effect<
  boolean,
  UnexpectedServerError,
  UserDbService | ContactDbService
> =>
  Effect.gen(function* (_) {
    const userDb = yield* _(UserDbService)
    const contactDb = yield* _(ContactDbService)

    yield* _(contactDb.deleteContactsByHashFrom(hash))

    const user = yield* _(userDb.findUserByHash(hash))
    if (Option.isNone(user)) {
      yield* _(Effect.logInfo('No existing user found.'))
      return false
    }

    yield* _(Effect.log('Removing existing user from database'))
    yield* _(
      userDb.deleteUserByPublicKeyAndHash({
        publicKey: user.value.publicKey,
        hash: user.value.hash,
      })
    )
    return true
  }).pipe(Effect.withSpan('Check and delete existing user'))

export const createUser = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'createUser',
  (req) =>
    CurrentSecurity.pipe(
      Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash)),
      Effect.flatMap((security) =>
        Effect.gen(function* (_) {
          yield* _(
            ensureLoginSessionProof({
              publicKey: security.publicKey,
              loginSessionId: req.payload.loginSessionId,
              loginSessionProof: req.payload.loginSessionProof,
            })
          )
          yield* _(
            ensureBelowPhoneNumberLimit({
              publicKey: security.publicKey,
              hash: security.serverHash,
            })
          )
          const userDb = yield* _(UserDbService)
          const numberExists = yield* _(deleteIfExists(security.serverHash))
          const vexlNotificationToken = req.payload.vexlNotificationToken

          yield* _(
            reportUserLoggedIn({
              countryPrefix: Option.getOrElse(
                req.headers.prefixOrNone,
                (): CountryPrefix | 'none' => 'none'
              ),
              numberExists,
              commonMetricAttributes: commonMetricAttributesFromHeaders(
                req.headers
              ),
            })
          )

          if (Option.isSome(vexlNotificationToken)) {
            yield* _(
              userDb.clearVexlNotificationTokenHeldByOtherUsers({
                publicKey: security.publicKey,
                hash: security.serverHash,
                token: vexlNotificationToken.value,
              })
            )
          }

          yield* _(
            userDb.insertUser({
              publicKey: security.publicKey,
              hash: security.serverHash,
              vexlNotificationToken,
              clientVersion: req.headers.clientVersionOrNone,
              platform: req.headers.clientPlatformOrNone,
              appSource: req.headers.appSourceOrNone,
              publicKeyV2: security.publicKeyV2,
              loginSessionId: Option.fromNullable(req.payload.loginSessionId),
            })
          )
          return {}
        }).pipe(withDbTransaction, withUserActionRedisLock(security.hash))
      ),
      makeEndpointEffect
    )
)
