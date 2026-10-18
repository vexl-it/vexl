import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type BackupNotificationSecret} from '@vexl-next/resources-utils/src/backup/BackupFile'
import {Array, HashMap, Record} from 'effect'
import {type VexlNotificationSecretState} from '../notifications/vexlNotificationTokenAtom'

type TokenToKeyHolder = Record.ReadonlyRecord<
  VexlNotificationToken,
  PrivateKeyHolder
>

export const notificationSecretForBackup = ({
  notificationState,
  tokenToKeyHolder,
  sessionNotificationToken,
}: {
  notificationState: VexlNotificationSecretState
  tokenToKeyHolder: TokenToKeyHolder
  sessionNotificationToken: VexlNotificationToken | undefined
}): BackupNotificationSecret | undefined => {
  if (!notificationState.secret) return undefined

  return {
    secret: notificationState.secret,
    systemVexlToken: notificationState.systemVexlToken ?? undefined,
    marketingVexlToken: notificationState.marketingVexlToken ?? undefined,
    sessionNotificationToken,
    inboxesByToken: Record.map(
      tokenToKeyHolder,
      (keyHolder) => keyHolder.publicKeyPemBase64
    ),
  }
}

// Tokens of inboxes that are gone are dropped.
export const restoredTokenToKeyHolder = (
  inboxesByToken: Record.ReadonlyRecord<
    VexlNotificationToken,
    PublicKeyPemBase64
  >,
  inboxKeys: readonly PrivateKeyHolder[]
): TokenToKeyHolder => {
  const keyHolders = HashMap.fromIterable(
    Array.map(inboxKeys, (key): [PublicKeyPemBase64, PrivateKeyHolder] => [
      key.publicKeyPemBase64,
      key,
    ])
  )
  return Record.filterMap(inboxesByToken, (publicKey) =>
    HashMap.get(keyHolders, publicKey)
  )
}

export const restoredNotificationSecretState = (
  backup: BackupNotificationSecret
): VexlNotificationSecretState => ({
  secret: backup.secret,
  systemVexlToken: backup.systemVexlToken ?? null,
  marketingVexlToken: backup.marketingVexlToken ?? null,
  // Unknown, so the takeover sync always sends the push token.
  lastUpdatedMetadata: null,
})
