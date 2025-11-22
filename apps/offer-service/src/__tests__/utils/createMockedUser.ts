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
import {makeCommonAndSecurityHeaders} from '@vexl-next/rest-api/src/apiSecurity'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect, Schema} from 'effect'

export interface MockedUser {
  mainKeyPair: PrivateKeyHolder
  authHeaders: {
    'public-key': PublicKeyPemBase64
    signature: EcdsaSignature
    hash: HashedPhoneNumber
  }
}

export const commonHeaders = Schema.decodeSync(CommonHeaders)({
  'user-agent': 'Vexl/1 (1.0.0) ANDROID',
})

export const makeTestCommonAndSecurityHeaders = (authHeaders: {
  'public-key': PublicKeyPemBase64
  signature: EcdsaSignature
  hash: HashedPhoneNumber
}): ReturnType<typeof makeCommonAndSecurityHeaders> => {
  return makeCommonAndSecurityHeaders(
    () => ({
      publicKey: authHeaders['public-key'],
      hash: authHeaders.hash,
      signature: authHeaders.signature,
    }),
    commonHeaders
  )
}

export const createMockedUser = (
  numberRaw: string
): Effect.Effect<MockedUser, CryptoError, ServerCrypto> =>
  Effect.gen(function* (_) {
    const mainKeyPair = generatePrivateKey()
    const phoneNumber = Schema.decodeSync(E164PhoneNumberE)(numberRaw)

    const authHeaders = yield* _(
      createDummyAuthHeadersForUser({
        phoneNumber,
        publicKey: mainKeyPair.publicKeyPemBase64,
      })
    )

    return {
      mainKeyPair,
      authHeaders,
    }
  })
