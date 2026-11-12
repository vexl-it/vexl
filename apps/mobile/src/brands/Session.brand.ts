import {KeyHolder} from '@vexl-next/cryptography'
import {KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {LoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {
  KeyDerivationId,
  MasterSeed,
} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {UserNameAndUriAvatar} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  UserSessionCredentials,
  UserSessionCredentialsV2,
} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {Array, Schema} from 'effect'

// Stored by app versions before the master seed and login session id were introduced.
export const LegacySessionV2 = Schema.Struct({
  version: Schema.Int.pipe(Schema.greaterThanOrEqualTo(0)),
  realUserData: Schema.optional(UserNameAndUriAvatar),
  phoneNumber: E164PhoneNumber,
  sessionCredentials: UserSessionCredentialsV2,
  sessionNotificationToken: Schema.optional(VexlNotificationToken),
  privateKey: KeyHolder.PrivateKeyHolder,
  keyPairV2: KeyPairV2,
  isLiquidityProvider: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
})
export type LegacySessionV2 = typeof LegacySessionV2.Type

// A phone number of the account with the keys and credentials the servers
// know it by. The main number uses the session keys.
export const SessionPhoneNumber = Schema.Struct({
  phoneNumber: E164PhoneNumber,
  sessionCredentials: UserSessionCredentialsV2,
  privateKey: KeyHolder.PrivateKeyHolder,
  keyPairV2: KeyPairV2,
})
export type SessionPhoneNumber = typeof SessionPhoneNumber.Type

// Keys of an extra number are derived from the master seed with this id
export const ExtraSessionPhoneNumber = Schema.Struct({
  ...SessionPhoneNumber.fields,
  keyDerivationId: KeyDerivationId,
})
export type ExtraSessionPhoneNumber = typeof ExtraSessionPhoneNumber.Type

export const SessionV2 = Schema.Struct({
  ...LegacySessionV2.fields,
  masterSeed: MasterSeed,
  loginSessionId: LoginSessionId,
  // `phoneNumber` + `sessionCredentials` are the main number
  extraPhoneNumbers: Schema.optional(Schema.Array(ExtraSessionPhoneNumber)),
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

const areCredentialsOfKeys = ({
  sessionCredentials,
  privateKey,
  keyPairV2,
}: Omit<SessionPhoneNumber, 'phoneNumber'>): boolean =>
  // Hash should be the same for V1 and V2
  sessionCredentials.hash === sessionCredentials.vexlAuthHeader.data.hash &&
  // Vexl pub header should match the pub key v2
  keyPairV2.publicKey === sessionCredentials.vexlAuthHeader.data.pk &&
  // The old pub key should match the key in old session credentials
  sessionCredentials.publicKey === privateKey.publicKeyPemBase64

export const sanityCheckSessionV2 = (session: SessionV2): boolean => {
  const extraPhoneNumbers = session.extraPhoneNumbers ?? []
  const publicKeys = [
    session.privateKey.publicKeyPemBase64,
    ...Array.map(extraPhoneNumbers, (one) => one.privateKey.publicKeyPemBase64),
  ]
  return (
    areCredentialsOfKeys(session) &&
    Array.every(extraPhoneNumbers, areCredentialsOfKeys) &&
    Array.dedupe(publicKeys).length === publicKeys.length
  )
}

/**
 * Everything in the session that must never reach logs or error reports.
 */
export const sensitiveValuesOfSession = (session: SessionV2): string[] =>
  Array.filter(
    [
      session.masterSeed,
      ...Array.flatMap(
        [session, ...(session.extraPhoneNumbers ?? [])],
        (one) => [
          one.phoneNumber,
          one.sessionCredentials.signature,
          one.sessionCredentials.hash,
          one.sessionCredentials.publicKey,
          one.privateKey.privateKeyPemBase64,
          one.keyPairV2.publicKey,
          one.keyPairV2.privateKey,
        ]
      ),
      ...(session.realUserData?.userName
        ? [session.realUserData.userName]
        : []),
    ],
    (one) => one.trim() !== ''
  )

export const Session = Schema.Union(SessionV2, LegacySessionV2, SessionV1)
export type Session = typeof Session.Type
