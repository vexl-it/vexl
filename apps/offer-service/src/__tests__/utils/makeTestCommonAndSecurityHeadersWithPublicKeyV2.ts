import {type PublicKeyV2} from '@vexl-next/cryptography'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {makeCommonAndSecurityHeaders} from '@vexl-next/rest-api/src/apiSecurity'
import {
  UserDataShape,
  VexlAuthHeader,
} from '@vexl-next/rest-api/src/VexlAuthHeader'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, Schema} from 'effect'
import {commonHeaders} from './createMockedUser'

export const makeTestCommonAndSecurityHeadersWithPublicKeyV2 = ({
  authHeaders,
  publicKeyV2,
}: {
  authHeaders: {
    'public-key': PublicKeyPemBase64
    signature: EcdsaSignature
    hash: HashedPhoneNumber
  }
  publicKeyV2: PublicKeyV2
}): Effect.Effect<
  ReturnType<typeof makeCommonAndSecurityHeaders>,
  unknown,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const crypto = yield* _(ServerCrypto)
    const encodedData = yield* _(
      Schema.encode(UserDataShape)({
        hash: authHeaders.hash,
        pk: publicKeyV2,
      })
    )

    const signature = yield* _(crypto.cryptoBoxSign(encodedData))
    const vexlAuthHeader = yield* _(
      Schema.decode(VexlAuthHeader)(`VexlAuth ${encodedData}.${signature}`)
    )

    return makeCommonAndSecurityHeaders(
      () => ({
        publicKey: authHeaders['public-key'],
        hash: authHeaders.hash,
        signature: authHeaders.signature,
        vexlAuthHeader,
      }),
      commonHeaders
    )
  })
