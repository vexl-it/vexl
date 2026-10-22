import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type BackupNotificationSecret} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {type VexlNotificationSecretState} from '../notifications/vexlNotificationTokenAtom'

export const notificationSecretForBackup = ({
  secret,
}: VexlNotificationSecretState): BackupNotificationSecret | undefined =>
  secret ? {secret} : undefined

// No tokens and no metadata, so the takeover sync mints fresh system and
// marketing tokens and always sends the push token.
export const restoredNotificationSecretState = (
  secret: VexlNotificationTokenSecret
): VexlNotificationSecretState => ({
  secret,
  systemVexlToken: null,
  marketingVexlToken: null,
  lastUpdatedMetadata: null,
})
