import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  type CryptoError,
  type EcdsaSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, pipe, Schema} from 'effect'
import {ServerCrypto} from './ServerCrypto'

export const hashPhoneNumber = (
  phoneNumber: E164PhoneNumber
): Effect.Effect<HashedPhoneNumber, CryptoError, ServerCrypto> =>
  ServerCrypto.pipe(
    Effect.flatMap((crypto) => crypto.signWithHmac(phoneNumber)),
    Effect.map(Schema.decodeSync(HashedPhoneNumber)),
    Effect.tapError((e) =>
      Effect.logError('Error while hashing phone number', e)
    )
  )
export const generateUserAuthData = ({
  phoneNumberHashed,
  publicKey,
}: {
  phoneNumberHashed: HashedPhoneNumber
  publicKey: PublicKeyPemBase64
}): Effect.Effect<
  {
    signature: EcdsaSignature
    hash: HashedPhoneNumber
  },
  CryptoError,
  ServerCrypto
> =>
  Effect.gen(function* () {
    const dataToSign = `${publicKey}${phoneNumberHashed}`

    const crypto = yield* ServerCrypto

    const signature = yield* pipe(
      crypto.signEcdsa(dataToSign),
      Effect.tapError((e) =>
        Effect.logError('Error while signing user auth data', e)
      )
    )
    return {
      signature,
      hash: phoneNumberHashed,
    }
  })
