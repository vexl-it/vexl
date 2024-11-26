import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {CreateUserEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option, Schema} from 'effect'
import {Handler} from 'effect-http'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'

const deleteIfExists = (
  hash: HashedPhoneNumber
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

export const createUser = Handler.make(CreateUserEndpoint, (req, security) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const userDb = yield* _(UserDbService)
      yield* _(deleteIfExists(security.hash))

      yield* _(
        userDb.insertUser({
          publicKey: security['public-key'],
          hash: security.hash,
          firebaseToken: Option.fromNullable(req.body.firebaseToken),
          clientVersion: req.headers.clientVersionOrNone,
          platform: req.headers.clientPlatformOrNone,
        })
      )
      return {}
    }).pipe(withDbTransaction, withUserActionRedisLock(security.hash)),
    Schema.Void
  )
)
