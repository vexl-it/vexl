import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {
  generatePrivateKey,
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  type CryptoError,
  type EcdsaSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect} from 'effect'
import {type ClientError} from 'effect-http'
import {addChallengeForKey} from './addChallengeForKey'
import {NodeTestingApp} from './NodeTestingApp'

interface MockedInbox {
  keyPair: PrivateKeyHolder
  addChallenge: ReturnType<typeof addChallengeForKey>
}

export interface MockedUser {
  mainKeyPair: PrivateKeyHolder
  authHeaders: {
    'public-key': PublicKeyPemBase64
    signature: EcdsaSignature
    hash: HashedPhoneNumber
  }
  addChallengeForMainInbox: ReturnType<typeof addChallengeForKey>
  inbox1: MockedInbox
  inbox2: MockedInbox
  inbox3: MockedInbox
}

export const createMockedInbox = (authHeaders: {
  'public-key': PublicKeyPemBase64
  signature: EcdsaSignature
  hash: HashedPhoneNumber
}): Effect.Effect<
  MockedInbox,
  CryptoError | ClientError.ClientError,
  NodeTestingApp
> =>
  Effect.gen(function* (_) {
    const keyPair = generatePrivateKey()
    const addChallenge = addChallengeForKey(keyPair, authHeaders)

    const client = yield* _(NodeTestingApp)
    yield* _(
      client.createInbox(
        {
          body: yield* _(addChallenge({})),
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          }),
        },
        HttpClientRequest.setHeaders(authHeaders)
      )
    )

    return {keyPair, addChallenge}
  })

export const createMockedUser = (
  numberRaw: string
): Effect.Effect<
  MockedUser,
  CryptoError | ClientError.ClientError,
  NodeTestingApp | ServerCrypto
> =>
  Effect.gen(function* (_) {
    const mainKeyPair = generatePrivateKey()
    const number = Schema.decodeSync(E164PhoneNumberE)(numberRaw)

    const authHeaders = yield* _(
      createDummyAuthHeadersForUser({
        phoneNumber: number,
        publicKey: mainKeyPair.publicKeyPemBase64,
      })
    )

    const addChallengeForMainInbox = addChallengeForKey(
      mainKeyPair,
      authHeaders
    )

    const client = yield* _(NodeTestingApp)
    yield* _(
      client.createInbox(
        {
          body: yield* _(addChallengeForMainInbox({})),
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          }),
        },
        HttpClientRequest.setHeaders(authHeaders)
      )
    )

    const inbox1 = yield* _(createMockedInbox(authHeaders))
    const inbox2 = yield* _(createMockedInbox(authHeaders))
    const inbox3 = yield* _(createMockedInbox(authHeaders))

    return {
      mainKeyPair,
      authHeaders,
      addChallengeForMainInbox,
      inbox1,
      inbox2,
      inbox3,
    }
  })
