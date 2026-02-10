import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {makeCommonAndSecurityHeaders} from '@vexl-next/rest-api/src/apiSecurity'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {
  hashForClient,
  serverHashPhoneNumber,
} from '../../../utils/serverHashContact'
import {NodeTestingApp} from '../../utils/NodeTestingApp'

export const commonHeaders = Schema.decodeSync(CommonHeaders)({
  'user-agent': 'Vexl/1 (1.0.0) ANDROID',
})

export const makeTestCommonAndSecurityHeaders = (
  authHeaders: ReturnType<
    typeof createDummyAuthHeadersForUser
  > extends Effect.Effect<infer A, any, any>
    ? A
    : never,
  customCommonHeaders?: CommonHeaders
): ReturnType<typeof makeCommonAndSecurityHeaders> => {
  return makeCommonAndSecurityHeaders(
    () => ({
      publicKey: authHeaders['public-key'],
      hash: authHeaders.hash,
      signature: authHeaders.signature,
    }),
    customCommonHeaders ?? commonHeaders
  )
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const generateKeysAndHasheForNumber = (numberRaw: string) =>
  Effect.gen(function* (_) {
    const number = yield* _(Schema.decode(E164PhoneNumber)(numberRaw))
    const hashedNumber = yield* _(hashPhoneNumber(number))
    const keys = generatePrivateKey()
    const authHeaders = yield* _(
      createDummyAuthHeadersForUser({
        phoneNumber: number,
        publicKey: keys.publicKeyPemBase64,
      })
    )

    const serverHashedNumber = yield* _(serverHashPhoneNumber(hashedNumber))
    const serverHashedNumberForClient = yield* _(
      hashForClient(serverHashedNumber)
    )

    return {
      phoneNumber: number,
      hashedNumber,
      keys,
      authHeaders,
      notificationToken: Schema.decodeSync(ExpoNotificationToken)(
        `token:${number}`
      ),
      serverHashedNumber,
      serverHashedNumberForClient,
    }
  })

export type DummyUser = Effect.Effect.Success<
  ReturnType<typeof generateKeysAndHasheForNumber>
>

export const createAndImportUsersFromNetwork = (
  user: DummyUser,
  users: DummyUser[]
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    yield* _(addTestHeaders(user.authHeaders))

    const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
      user.authHeaders
    )

    yield* _(
      app.User.createUser({
        payload: {
          expoToken: user.notificationToken,
          firebaseToken: null,
          publicKeyV2: Option.none(),
        },
        headers: commonAndSecurityHeaders,
      })
    )

    yield* _(addTestHeaders(user.authHeaders))
    yield* _(
      app.Contact.importContacts({
        payload: {
          contacts: pipe(
            users,
            Array.map((u) => u.hashedNumber),
            Array.filter((h) => h !== user.hashedNumber)
          ),
          replace: true,
        },
        headers: commonAndSecurityHeaders,
      })
    )
  })

export const createUserOnNetwork = (
  user: DummyUser
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    yield* _(addTestHeaders(user.authHeaders))

    const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
      user.authHeaders
    )

    yield* _(
      app.User.createUser({
        payload: {
          expoToken: user.notificationToken,
          firebaseToken: null,
          publicKeyV2: Option.none(),
        },
        headers: commonAndSecurityHeaders,
      })
    )
  })

export const importUsersFromNetwork = (
  user: DummyUser,
  users: DummyUser[]
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)

    yield* _(addTestHeaders(user.authHeaders))
    const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
      user.authHeaders
    )
    yield* _(
      app.Contact.importContacts({
        payload: {
          contacts: pipe(
            users,
            Array.map((u) => u.hashedNumber),
            Array.filter((h) => h !== user.hashedNumber)
          ),
          replace: true,
        },
        headers: commonAndSecurityHeaders,
      })
    )
  })
