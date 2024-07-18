import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  type CryptoError,
  type EcdsaSignature,
  type HmacHash,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect} from 'effect'
import {ServerCrypto} from './ServerCrypto'

export const hashPhoneNumber = (
  phoneNumber: E164PhoneNumber
): Effect.Effect<HmacHash, CryptoError, ServerCrypto> =>
  ServerCrypto.pipe(
    Effect.flatMap((crypto) => crypto.signWithHmac(phoneNumber)),
    Effect.tapError((e) =>
      Effect.logError(e, 'Error while hasing phone number')
    )
  )
export const generateUserAuthData = ({
  phoneNumber,
  publicKey,
}: {
  phoneNumber: E164PhoneNumber
  publicKey: PublicKeyPemBase64
}): Effect.Effect<
  {
    signature: EcdsaSignature
    hash: HmacHash
  },
  CryptoError,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const hashedNumber = yield* _(hashPhoneNumber(phoneNumber))
    const dataToSign = `${publicKey}${hashedNumber}`

    const crypto = yield* _(ServerCrypto)

    const signature = yield* _(
      crypto.signEcdsa(dataToSign),
      Effect.tapError((e) =>
        Effect.logError(e, 'Error while signing user auth data')
      )
    )
    return {
      signature,
      hash: hashedNumber,
    }
  })
