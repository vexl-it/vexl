import {KeyHolder} from '@vexl-next/cryptography'
import {KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {UserNameAndUriAvatar} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  UserSessionCredentials,
  UserSessionCredentialsV2,
} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {Schema} from 'effect'

export const SessionV2 = Schema.Struct({
  version: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  realUserData: Schema.optional(UserNameAndUriAvatar),
  phoneNumber: E164PhoneNumber,
  sessionCredentials: UserSessionCredentialsV2,
  sessionNotificationToken: Schema.optional(VexlNotificationToken),
  privateKey: KeyHolder.PrivateKeyHolder,
  keyPairV2: KeyPairV2,
})
export type SessionV2 = typeof SessionV2.Type

export const isSessionV2 = Schema.is(SessionV2)

export const SessionV1 = Schema.Struct({
  version: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  realUserData: Schema.optional(UserNameAndUriAvatar),
  phoneNumber: E164PhoneNumber,
  sessionCredentials: UserSessionCredentials,
  sessionNotificationToken: Schema.optional(VexlNotificationToken),
  privateKey: KeyHolder.PrivateKeyHolder,
  keyPairV2: Schema.optionalWith(Schema.Undefined, {default: () => undefined}),
})
export type SessionV1 = typeof SessionV1.Type
export const isSessionV1 = Schema.is(SessionV1)

export const sanityCheckSessionV2 = (session: SessionV2): boolean => {
  return (
    // Hash should be the same for V1 and V2
    session.sessionCredentials.hash ===
      session.sessionCredentials.vexlAuthHeader.data.hash &&
    // Vexl pub header should match the pub key v2
    session.keyPairV2.publicKey ===
      session.sessionCredentials.vexlAuthHeader.data.pk &&
    // The old pub key should match the key in old session credentials
    session.sessionCredentials.publicKey ===
      session.privateKey.publicKeyPemBase64
  )
}

export const Session = Schema.Union(SessionV2, SessionV1)
export type Session = typeof Session.Type
