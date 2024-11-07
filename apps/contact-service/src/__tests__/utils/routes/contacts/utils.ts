import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Array, Effect, pipe} from 'effect'
import {NodeTestingApp} from '../../NodeTestingApp'

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
      firebaseToken: Schema.decodeSync(FcmTokenE)(`token:${number}`),
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
    yield* _(
      app.createUser(
        {
          body: {
            firebaseToken: user.firebaseToken,
          },
          headers: commonHeaders,
        },
        HttpClientRequest.setHeaders(user.authHeaders)
      )
    )

    yield* _(
      app.importContacts(
        {
          body: {
            contacts: pipe(
              users,
              Array.map((u) => u.hashedNumber),
              Array.filter((h) => h !== user.hashedNumber)
            ),
            replace: true,
          },
        },
        HttpClientRequest.setHeaders(user.authHeaders)
      )
    )
  })
