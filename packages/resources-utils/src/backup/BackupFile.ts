import {
  KeyPairV2,
  PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {ClubKeys, ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {MasterSeed} from '@vexl-next/domain/src/general/MasterSeed.brand'
import {UserSessionCredentialsV2} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {Schema} from 'effect'

export const BACKUP_FILE_EXTENSION = 'vexl-backup'

export const BackupSession = Schema.Struct({
  phoneNumber: E164PhoneNumber,
  sessionCredentials: UserSessionCredentialsV2,
  privateKey: PrivateKeyHolder,
  keyPairV2: KeyPairV2,
  isLiquidityProvider: Schema.Boolean,
})
export type BackupSession = typeof BackupSession.Type

export const BackupFile = Schema.Struct({
  version: Schema.Literal(1),
  session: BackupSession,
  masterSeed: MasterSeed,
  legacyInboxKeys: Schema.Array(PrivateKeyHolder),
  legacyClubKeys: Schema.Record({key: ClubUuid, value: ClubKeys}),
  legacyClubKeysWaitingForAdmission: Schema.Array(ClubKeys),
})
export type BackupFile = typeof BackupFile.Type

export const BackupFileFromJson = Schema.parseJson(BackupFile)
