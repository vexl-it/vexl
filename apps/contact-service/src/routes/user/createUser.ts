import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {reportUserLoggedIn} from '../../metrics'
import {
  serverHashPhoneNumber,
  type ServerHashedNumber,
} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'

const deleteIfExists = (
  hash: ServerHashedNumber
): Effect.Effect<
  boolean,
  UnexpectedServerError,
  UserDbService | ContactDbService
> =>
  Effect.gen(function* () {
    const userDb = yield* UserDbService
    const contactDb = yield* ContactDbService

    const user = yield* userDb.findUserByHash(hash)
    if (Option.isNone(user)) {
      yield* Effect.logInfo('No existing user found. Db is clean.')
      return false
    }

    yield* Effect.log('Removing existing user from database', user.value)

    yield* contactDb.deleteContactsByHashFrom(user.value.hash)
    yield* userDb.deleteUserByPublicKeyAndHash({
      publicKey: user.value.publicKey,
      hash: user.value.hash,
    })
    return true
  }).pipe(Effect.withSpan('Check and delete existing user'))

export const createUser = makeHttpApiHandler(
  ContactApiSpecification,
  'User',
  'createUser',
  (req) =>
    CurrentSecurity.pipe(
      Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash)),
      Effect.flatMap((security) =>
        Effect.gen(function* () {
          const userDb = yield* UserDbService
          const numberExists = yield* deleteIfExists(security.serverHash)
          const expoToken = Option.fromNullishOr(req.payload.expoToken)
          const vexlNotificationToken = req.payload.vexlNotificationToken

          yield* reportUserLoggedIn({
            countryPrefix: Option.getOrElse(
              req.headers.prefixOrNone,
              (): CountryPrefix | 'none' => 'none'
            ),
            numberExists,
            commonMetricAttributes: commonMetricAttributesFromHeaders(
              req.headers
            ),
          })

          if (Option.isSome(expoToken)) {
            yield* userDb.clearExpoTokenHeldByOtherUsers({
              publicKey: security.publicKey,
              hash: security.serverHash,
              token: expoToken.value,
            })
          }

          if (Option.isSome(vexlNotificationToken)) {
            yield* userDb.clearVexlNotificationTokenHeldByOtherUsers({
              publicKey: security.publicKey,
              hash: security.serverHash,
              token: vexlNotificationToken.value,
            })
          }

          yield* userDb.insertUser({
            publicKey: security.publicKey,
            hash: security.serverHash,
            expoToken,
            firebaseToken: Option.fromNullishOr(req.payload.firebaseToken),
            vexlNotificationToken,
            clientVersion: req.headers.clientVersionOrNone,
            platform: req.headers.clientPlatformOrNone,
            appSource: req.headers.appSourceOrNone,
            publicKeyV2: security.publicKeyV2,
          })
          return {}
        }).pipe(withDbTransaction, withUserActionRedisLock(security.hash))
      ),
      makeEndpointEffect
    )
)
