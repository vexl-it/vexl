import {
  KeyPairV2,
  PrivateKeyHolder,
  PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {seal, unseal} from '@vexl-next/cryptography/src/operations/cryptobox'
import {
  decryptWithPassword,
  encryptWithPassword,
  WrongPasswordError,
} from '@vexl-next/cryptography/src/operations/passwordEncryption'
import {ClubKeys, ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {MasterSeed} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {UserSessionCredentialsV2} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {Effect, Schema} from 'effect'

export const BACKUP_FILE_EXTENSION = 'vexl-backup'

export const BackupUserData = Schema.Struct({
  userName: Schema.optional(UserName),
  // The avatar file itself - its URI only points into the old device's storage.
  image: Schema.optional(
    Schema.Struct({
      base64: Base64String,
      extension: Schema.String.pipe(Schema.pattern(/^[a-z0-9]{1,5}$/)),
    })
  ),
})
export type BackupUserData = typeof BackupUserData.Type

// Taken over by the restored device, so every notification token handed out
// (in offers, notes, chats and clubs) keeps notifying the user. Only the secret:
// tokens go stale while the old device keeps using the app, so they are minted
// anew on restore.
export const BackupNotificationSecret = Schema.Struct({
  secret: VexlNotificationTokenSecret,
})
export type BackupNotificationSecret = typeof BackupNotificationSecret.Type

export const BackupSession = Schema.Struct({
  phoneNumber: E164PhoneNumber,
  sessionCredentials: UserSessionCredentialsV2,
  privateKey: PrivateKeyHolder,
  keyPairV2: KeyPairV2,
  isLiquidityProvider: Schema.Boolean,
  realUserData: Schema.optional(BackupUserData),
})
export type BackupSession = typeof BackupSession.Type

export const BackupFile = Schema.Struct({
  session: BackupSession,
  masterSeed: MasterSeed,
  legacyInboxKeys: Schema.Array(PrivateKeyHolder),
  legacyClubKeys: Schema.Record({key: ClubUuid, value: ClubKeys}),
  legacyClubKeysWaitingForAdmission: Schema.Array(ClubKeys),
  // Missing when the device had no secret when exporting.
  notificationSecret: Schema.optional(BackupNotificationSecret),
})
export type BackupFile = typeof BackupFile.Type

export const BackupFileFromJson = Schema.parseJson(BackupFile)

export const BackupPin = Schema.String.pipe(
  Schema.pattern(/^\d{4,8}$/),
  Schema.brand('BackupPin')
)
export type BackupPin = typeof BackupPin.Type

// The backup is encrypted with the PIN and then sealed to a key pair the server
// derives from the phone number. The private key is released only after SMS
// verification, so a stolen session alone can never open a backup.
export const EncryptedBackupFile = Schema.Struct({
  version: Schema.Literal(1),
  publicKey: PublicKeyV2,
  ciphertext: Schema.String,
})
export type EncryptedBackupFile = typeof EncryptedBackupFile.Type

export const EncryptedBackupFileFromJson = Schema.parseJson(EncryptedBackupFile)

export class BackupFileWrongPhoneNumberError extends Schema.TaggedError<BackupFileWrongPhoneNumberError>(
  'BackupFileWrongPhoneNumberError'
)('BackupFileWrongPhoneNumberError', {}) {}

export class BackupFileWrongPinError extends Schema.TaggedError<BackupFileWrongPinError>(
  'BackupFileWrongPinError'
)('BackupFileWrongPinError', {}) {}

export class BackupFileCorruptedError extends Schema.TaggedError<BackupFileCorruptedError>(
  'BackupFileCorruptedError'
)('BackupFileCorruptedError', {}) {}

export const encryptBackupFile = ({
  backup,
  pin,
  publicKey,
}: {
  backup: BackupFile
  pin: BackupPin
  publicKey: PublicKeyV2
}): Effect.Effect<EncryptedBackupFile, CryptoError> =>
  Effect.gen(function* (_) {
    const json = yield* _(
      Schema.encode(BackupFileFromJson)(backup),
      Effect.mapError(
        () => new CryptoError({message: 'Unable to encode backup file'})
      )
    )

    const ciphertext = yield* _(
      Effect.tryPromise({
        try: async () =>
          await seal(
            await encryptWithPassword({data: json, password: pin}),
            publicKey
          ),
        catch: (error) =>
          new CryptoError({message: 'Unable to encrypt backup file', error}),
      })
    )

    const encrypted: EncryptedBackupFile = {version: 1, publicKey, ciphertext}
    return encrypted
  })

export const decryptBackupFile = ({
  file,
  pin,
  keyPair,
}: {
  file: EncryptedBackupFile
  pin: BackupPin
  keyPair: KeyPairV2
}): Effect.Effect<
  BackupFile,
  | BackupFileWrongPhoneNumberError
  | BackupFileWrongPinError
  | BackupFileCorruptedError
> =>
  Effect.gen(function* (_) {
    if (file.publicKey !== keyPair.publicKey)
      return yield* _(new BackupFileWrongPhoneNumberError())

    const pinEncrypted = yield* _(
      Effect.tryPromise({
        try: async () => await unseal(file.ciphertext, keyPair),
        catch: () => new BackupFileCorruptedError(),
      })
    )

    const json = yield* _(
      Effect.tryPromise({
        try: async () =>
          await decryptWithPassword({data: pinEncrypted, password: pin}),
        catch: (e) =>
          e instanceof WrongPasswordError
            ? new BackupFileWrongPinError()
            : new BackupFileCorruptedError(),
      })
    )

    // Parse errors would echo the decrypted keys, so they are not passed on.
    return yield* _(
      Schema.decode(BackupFileFromJson)(json),
      Effect.mapError(() => new BackupFileCorruptedError())
    )
  })
