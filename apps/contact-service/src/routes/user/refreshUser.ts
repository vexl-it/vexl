import {HttpApiBuilder} from '@effect/platform/index'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type LoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {
  type InvalidLoginSessionProofError,
  LoggedInOnAnotherDeviceError,
  type LoginSessionProof,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {type RedisService} from '@vexl-next/server-utils/src/RedisService'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option} from 'effect'
import {UserDbService} from '../../db/UserDbService'
import {reportUserRefresh} from '../../metrics'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {
  ensureLoginSessionProof,
  type ProofInput,
  useUpLoginSessionProof,
} from './utils/ensureLoginSessionProof'
import {
  findUserOrFail,
  notifyContactsAboutReturnedUser,
  refreshUserRecord,
  type UserSecurity,
} from './utils/refreshUserRecord'

type LoginSessionError =
  | LoggedInOnAnotherDeviceError
  | InvalidLoginSessionProofError
  | UnexpectedServerError

interface LoginSessionCheck {
  security: UserSecurity
  received: Option.Option<LoginSessionId>
  loginSessionProof: LoginSessionProof | undefined
}

const failLoggedInOnAnotherDevice = (
  proof: ProofInput
): Effect.Effect<never, LoginSessionError, RedisService> =>
  Effect.zipRight(
    useUpLoginSessionProof(proof),
    Effect.fail(new LoggedInOnAnotherDeviceError())
  )

// Users logged in before login sessions existed adopt the first one they send.
const ensureSameLoginSession = ({
  security,
  stored,
  received,
  loginSessionProof,
}: LoginSessionCheck & {
  stored: Option.Option<LoginSessionId>
}): Effect.Effect<void, LoginSessionError, UserDbService | RedisService> => {
  if (Option.isNone(received)) return Effect.void
  const proof = {
    publicKey: security.publicKey,
    loginSessionId: received.value,
    loginSessionProof,
  }
  if (Option.isSome(stored))
    return stored.value === received.value
      ? useUpLoginSessionProof(proof)
      : failLoggedInOnAnotherDevice(proof)

  return Effect.zipRight(
    ensureLoginSessionProof(proof),
    Effect.flatMap(UserDbService, (userDb) =>
      userDb.updateLoginSessionId({
        publicKey: security.publicKey,
        hash: security.serverHash,
        loginSessionId: received.value,
      })
    )
  )
}

// For a number the account no longer has. Another device holding the account
// must log this one out, not let it drop the account's other numbers.
const ensureAccountNotOnAnotherDevice = ({
  security,
  received,
  loginSessionProof,
}: LoginSessionCheck): Effect.Effect<
  void,
  LoginSessionError,
  UserDbService | RedisService
> =>
  Option.match(received, {
    onNone: () => Effect.void,
    onSome: (loginSessionId) =>
      UserDbService.pipe(
        Effect.flatMap((userDb) =>
          userDb.findLoginSessionIdsByPublicKey(security.publicKey)
        ),
        Effect.flatMap((stored) =>
          Array.some(stored, (one) => one !== loginSessionId)
            ? failLoggedInOnAnotherDevice({
                publicKey: security.publicKey,
                loginSessionId,
                loginSessionProof,
              })
            : Effect.void
        )
      ),
  })

export const refreshUser = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'refreshUser',
  (req) =>
    CurrentSecurity.pipe(
      Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash)),
      Effect.flatMap((security) =>
        Effect.gen(function* (_) {
          yield* _(
            reportUserRefresh(commonMetricAttributesFromHeaders(req.headers))
          )

          const loginSessionCheck = {
            security,
            received: Option.fromNullable(req.payload.loginSessionId),
            loginSessionProof: req.payload.loginSessionProof,
          }
          const existingUser = yield* _(
            findUserOrFail(security),
            Effect.tapErrorTag('UserNotFoundError', () =>
              ensureAccountNotOnAnotherDevice(loginSessionCheck)
            )
          )
          yield* _(
            ensureSameLoginSession({
              ...loginSessionCheck,
              stored: existingUser.loginSessionId,
            })
          )

          return yield* _(
            refreshUserRecord({
              security,
              headers: req.headers,
              vexlNotificationToken: req.payload.vexlNotificationToken,
              existingUser,
            })
          )
        }).pipe(
          withDbTransaction,
          withUserActionRedisLock(security.hash),
          Effect.tap(notifyContactsAboutReturnedUser),
          Effect.as({})
        )
      ),
      makeEndpointEffect
    )
)
