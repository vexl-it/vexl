import {Schema} from '@effect/schema'
import {importPrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {PrivateKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Effect} from 'effect'
import {generateUserAuthData} from '../generateUserAuthData'

export const DUMMY_PHONE_NUMBER =
  Schema.decodeSync(E164PhoneNumberE)('+420777777777')

export const DUMMY_KEY = importPrivateKey({
  privateKeyPemBase64: Schema.decodeSync(PrivateKeyPemBase64E)(
    'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0VBZ0VBTUJBR0J5cUdTTTQ5QWdFR0JTdUJCQUFLQkcwd2F3SUJBUVFna2JGT2VFZVRTdk1Bck5MQjRDdnoKdmpDdW1senFXSlNEOEZqWE05dVVDZ0NoUkFOQ0FBU29qMTI5dEpQN3NRaE0zUHI4d2ZXQWRRS3l4citYNHZaSgpsWngxdWZuNkRsbkZia2t1TGJNaEF0Z1hidlB0dVFQelVKR0ljbkpBdkI3YXlTYU5aSU0rCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K'
  ),
})

export const createDummyAuthHeaders = generateUserAuthData({
  phoneNumber: DUMMY_PHONE_NUMBER,
  publicKey: DUMMY_KEY.publicKeyPemBase64,
}).pipe(
  Effect.map((auth) => ({...auth, 'public-key': DUMMY_KEY.publicKeyPemBase64}))
)
