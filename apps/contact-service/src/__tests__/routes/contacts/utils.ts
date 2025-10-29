import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {addTestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, pipe, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'

const commonHeaders = Schema.decodeSync(CommonHeaders)({
  'user-agent': 'Vexl/1 (1.0.0) ANDROID',
})
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const generateKeysAndHasheForNumber = (numberRaw: string) =>
  Effect.gen(function* (_) {
    const number = yield* _(Schema.decode(E164PhoneNumberE)(numberRaw))
    const hashedNumber = yield* _(hashPhoneNumber(number))
    const keys = generatePrivateKey()
    const authHeaders = yield* _(
      createDummyAuthHeadersForUser({
        phoneNumber: number,
        publicKey: keys.publicKeyPemBase64,
      })
    )

    return {
      phoneNumber: number,
      hashedNumber,
      keys,
      authHeaders,
      notificationToken: Schema.decodeSync(ExpoNotificationTokenE)(
        `token:${number}`
      ),
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

    yield* _(
      app.User.createUser({
        payload: {
          expoToken: user.notificationToken,
          firebaseToken: null,
        },
        headers: commonHeaders,
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

    yield* _(
      app.User.createUser({
        payload: {
          expoToken: user.notificationToken,
          firebaseToken: null,
        },
        headers: commonHeaders,
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
      })
    )
  })
