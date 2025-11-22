import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {makeCommonAndSecurityHeaders} from '@vexl-next/rest-api/src/apiSecurity'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {Schema} from 'effect'

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
