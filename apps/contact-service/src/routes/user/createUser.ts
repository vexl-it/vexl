import {HttpApiBuilder} from '@effect/platform/index'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {
  serverHashPhoneNumber,
  type ServerHashedNumber,
} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'

const deleteIfExists = (
  hash: ServerHashedNumber
): Effect.Effect<
  void,
  UnexpectedServerError,
  UserDbService | ContactDbService
> =>
  Effect.gen(function* (_) {
    const userDb = yield* _(UserDbService)
    const contactDb = yield* _(ContactDbService)

    const user = yield* _(userDb.findUserByHash(hash))
    if (Option.isNone(user)) {
      yield* _(Effect.logInfo('No existing user found. Db is clean.'))
      return
    }

    yield* _(Effect.log('Removing existing user from database', user.value))

    yield* _(contactDb.deleteContactsByHashFrom(user.value.hash))
    yield* _(
      userDb.deleteUserByPublicKeyAndHash({
        publicKey: user.value.publicKey,
        hash: user.value.hash,
      })
    )
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
          const userDb = yield* _(UserDbService)
          yield* _(deleteIfExists(security.serverHash))

          yield* _(
            userDb.insertUser({
              publicKey: security.publicKey,
              hash: security.serverHash,
              expoToken: Option.fromNullable(req.payload.expoToken),
              firebaseToken: Option.fromNullable(req.payload.firebaseToken),
              clientVersion: req.headers.clientVersionOrNone,
              platform: req.headers.clientPlatformOrNone,
              appSource: req.headers.appSourceOrNone,
              publicKeyV2: req.payload.publicKeyV2,
            })
          )
          return {}
        }).pipe(withDbTransaction, withUserActionRedisLock(security.hash))
      ),
      makeEndpointEffect
    )
)
