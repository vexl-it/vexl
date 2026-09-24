import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {makeCommonAndSecurityHeaders} from '@vexl-next/rest-api/src/apiSecurity'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  UserDataShape,
  VexlAuthHeader,
} from '@vexl-next/rest-api/src/VexlAuthHeader'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
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
      vexlNotificationToken: Option.some(
        Schema.decodeSync(VexlNotificationToken)('vexl_nt_test')
      ),
      serverHashedNumber,
      serverHashedNumberForClient,
    }
  })

export type DummyUser = Effect.Effect.Success<
  ReturnType<typeof generateKeysAndHasheForNumber>
>

export const withEnvVar = async (
  name: string,
  value: string,
  run: () => Promise<void>
): Promise<void> => {
  const previousValue = process.env[name]

  process.env[name] = value

  try {
    await run()
  } finally {
    if (previousValue === undefined) {
      Reflect.deleteProperty(process.env, name)
    } else {
      process.env[name] = previousValue
    }
  }
}

export const withPublicImportCountThreshold = async (
  threshold: number,
  run: () => Promise<void>
): Promise<void> => {
  await withEnvVar(
    'CONTACT_PUBLIC_IMPORT_COUNT_THRESHOLD',
    String(threshold),
    run
  )
}

export const createVexlAuthHeader = ({
  hash,
  publicKeyV2,
}: {
  hash: DummyUser['authHeaders']['hash']
  publicKeyV2: PublicKeyV2
}): Effect.Effect<typeof VexlAuthHeader.Type, unknown, ServerCrypto> =>
  Effect.gen(function* (_) {
    const crypto = yield* _(ServerCrypto)
    const encodedData = yield* _(
      Schema.encode(UserDataShape)({
        hash,
        pk: publicKeyV2,
      })
    )

    const signature = yield* _(crypto.cryptoBoxSign(encodedData))
    return yield* _(
      Schema.decode(VexlAuthHeader)(`VexlAuth ${encodedData}.${signature}`)
    )
  })

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
          vexlNotificationToken: user.vexlNotificationToken,
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
          vexlNotificationToken: user.vexlNotificationToken,
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
