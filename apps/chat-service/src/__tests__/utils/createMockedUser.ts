import {type HttpClient} from '@effect/platform'
import {
  generatePrivateKey,
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {
  setAuthHeaders,
  TestRequestHeaders,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from './NodeTestingApp'
import {addChallengeForKey} from './addChallengeForKey'

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

export class CreatingUserError extends Schema.TaggedError<CreatingUserError>(
  'CreatingUserError'
)('CreatingUserError', {
  cause: Schema.Unknown,
  message: Schema.optional(Schema.String),
}) {}

export const createMockedInbox = (authHeaders: {
  'public-key': PublicKeyPemBase64
  signature: EcdsaSignature
  hash: HashedPhoneNumber
}): Effect.Effect<
  MockedInbox,
  CreatingUserError,
  HttpClient.HttpClient | TestRequestHeaders
> =>
  Effect.gen(function* (_) {
    const keyPair = generatePrivateKey()
    const addChallenge = addChallengeForKey(keyPair, authHeaders)
    const payload = yield* _(addChallenge({}))

    const client = yield* _(NodeTestingApp)
    const previousAuthHeaders = yield* _(TestRequestHeaders.getHeaders)
    yield* _(setAuthHeaders(authHeaders))
    yield* _(
      client.Inboxes.createInbox({
        payload,
        headers: Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
        }),
      })
    )

    yield* _(TestRequestHeaders.setHeaders(previousAuthHeaders))
    return {keyPair, addChallenge}
  }).pipe(
    Effect.mapError(
      (error) =>
        new CreatingUserError({
          cause: error,
          message: ' Creating mocked inbox failed',
        })
    )
  )

export const createMockedUser = (
  numberRaw: string
): Effect.Effect<
  MockedUser,
  CreatingUserError,
  HttpClient.HttpClient | TestRequestHeaders | ServerCrypto
> =>
  Effect.gen(function* (_) {
    const initHeaders = yield* _(TestRequestHeaders.getHeaders)
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

    const challengeForInbox = yield* _(addChallengeForMainInbox({}))
    yield* _(setAuthHeaders(authHeaders))
    yield* _(
      client.Inboxes.createInbox({
        payload: challengeForInbox,
        headers: Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
        }),
      })
    )

    const inbox1 = yield* _(createMockedInbox(authHeaders))
    const inbox2 = yield* _(createMockedInbox(authHeaders))
    const inbox3 = yield* _(createMockedInbox(authHeaders))

    yield* _(TestRequestHeaders.setHeaders(initHeaders))

    return {
      mainKeyPair,
      authHeaders,
      addChallengeForMainInbox,
      inbox1,
      inbox2,
      inbox3,
    }
  }).pipe(
    Effect.mapError(
      (error) =>
        new CreatingUserError({
          cause: error,
          message: ' Creating mocked user failed',
        })
    )
  )
