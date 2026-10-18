import {
  KeyPairV2,
  PrivateKeyHolder,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubKeys, ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {MasterSeed} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {
  VexlNotificationToken,
  VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {UserSessionCredentialsV2} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {Schema} from 'effect'

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
// (in offers, notes, chats and clubs) keeps notifying the user.
export const BackupNotificationSecret = Schema.Struct({
  secret: VexlNotificationTokenSecret,
  systemVexlToken: Schema.optional(VexlNotificationToken),
  marketingVexlToken: Schema.optional(VexlNotificationToken),
  sessionNotificationToken: Schema.optional(VexlNotificationToken),
  // Inbox each token minted before the export notifies about.
  inboxesByToken: Schema.Record({
    key: VexlNotificationToken,
    value: PublicKeyPemBase64,
  }),
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
  version: Schema.Literal(1),
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
