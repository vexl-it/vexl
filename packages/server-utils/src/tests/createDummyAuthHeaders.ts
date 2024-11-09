import {importPrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  PrivateKeyPemBase64E,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  type E164PhoneNumber,
  E164PhoneNumberE,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  type CryptoError,
  type EcdsaSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Schema} from 'effect'
import {generateUserAuthData, hashPhoneNumber} from '../generateUserAuthData'
import {type ServerCrypto} from '../ServerCrypto'

export const DUMMY_PHONE_NUMBER =
  Schema.decodeSync(E164PhoneNumberE)('+420777777777')

export const DUMMY_KEY = importPrivateKey({
  privateKeyPemBase64: Schema.decodeSync(PrivateKeyPemBase64E)(
    'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0VBZ0VBTUJBR0J5cUdTTTQ5QWdFR0JTdUJCQUFLQkcwd2F3SUJBUVFna2JGT2VFZVRTdk1Bck5MQjRDdnoKdmpDdW1senFXSlNEOEZqWE05dVVDZ0NoUkFOQ0FBU29qMTI5dEpQN3NRaE0zUHI4d2ZXQWRRS3l4citYNHZaSgpsWngxdWZuNkRsbkZia2t1TGJNaEF0Z1hidlB0dVFQelVKR0ljbkpBdkI3YXlTYU5aSU0rCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K'
  ),
})

export const createDummyAuthHeadersForUser = ({
  phoneNumber,
  publicKey,
}: {
  phoneNumber: E164PhoneNumber
  publicKey: PublicKeyPemBase64
}): Effect.Effect<
  {
    'public-key': PublicKeyPemBase64
    signature: EcdsaSignature
    hash: HashedPhoneNumber
  },
  CryptoError,
  ServerCrypto
> =>
  hashPhoneNumber(phoneNumber).pipe(
    Effect.flatMap((hashedPhoneNumber) =>
      generateUserAuthData({
        phoneNumberHashed: hashedPhoneNumber,
        publicKey,
      })
    ),
    Effect.map((auth) => ({
      ...auth,
      'public-key': publicKey,
    }))
  )
export const createDummyAuthHeaders = createDummyAuthHeadersForUser({
  phoneNumber: DUMMY_PHONE_NUMBER,
  publicKey: DUMMY_KEY.publicKeyPemBase64,
})
