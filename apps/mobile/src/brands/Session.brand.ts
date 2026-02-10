import {KeyHolder} from '@vexl-next/cryptography'
import {KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {UserNameAndUriAvatar} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {UserSessionCredentials} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {Schema} from 'effect'

export const Session = Schema.Struct({
  version: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  realUserData: Schema.optional(UserNameAndUriAvatar),
  phoneNumber: E164PhoneNumber,
  sessionCredentials: UserSessionCredentials,
  privateKey: KeyHolder.PrivateKeyHolder,
  // Optional V2 keypair for libsodium-based encryption (X25519)
  // Will be generated on first load if missing
  keyPairV2: Schema.optional(KeyPairV2),
})
export type Session = typeof Session.Type
